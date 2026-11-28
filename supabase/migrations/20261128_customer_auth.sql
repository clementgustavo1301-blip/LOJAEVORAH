-- ============================================================================
-- MIGRATION: HARDENED CUSTOMER AUTH, ACCOUNT AREA & STRICT ADMIN RLS
-- Project: LOJAEVORAH (EVORAH Experience)
-- Follows Supabase Postgres Best Practices:
--   - Private non-exposed schema for SECURITY DEFINER helpers
--   - Fixed search_path = '' on all functions
--   - (SELECT auth.uid()) / (SELECT auth.jwt()) initPlan optimization in RLS
--   - Zero anon/authenticated direct INSERT on orders/order_items (server-only)
--   - Non-overlapping permissive policies per action
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 1. Tabela de Perfis de Usuários (Separação estrita customer vs admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  cpf TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Endereços Salvos dos Clientes
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Principal',
  recipient_name TEXT,
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Favoritos Sincronizados na Nuvem
CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- 4. Vínculo opcional de pedidos com o cliente autenticado
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Índices de Performance (FKs e padrões de consulta)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_user_id ON public.customer_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_product_id ON public.customer_wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower ON public.orders(LOWER(customer_email));

-- 6. Permissões explícitas de tabela para Data API (protegidas por RLS abaixo)
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.customer_addresses FROM anon;
REVOKE ALL ON public.customer_wishlists FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.customer_wishlists TO authenticated;

-- 7. Funções e Triggers de Segurança (schema private + search_path vazio)
CREATE OR REPLACE FUNCTION private.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND (
      COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', FALSE)
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
          AND role = 'admin'
      )
    );
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_email_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = (SELECT auth.uid())
      AND email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION private.is_email_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_email_verified() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    jwt_role := COALESCE(current_setting('request.jwt.claim.role', true), '');
    IF jwt_role NOT IN ('service_role', 'supabase_admin')
       AND current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Alteração de permissão não autorizada.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_profile_role_escalation() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  extracted_name TEXT;
BEGIN
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)
  );

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    LOWER(COALESCE(NEW.email, '')),
    extracted_name,
    CASE
      WHEN COALESCE(NEW.raw_app_meta_data ->> 'role', '') = 'admin' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  -- Vincula automaticamente pedidos antigos apenas se o e-mail já estiver verificado (ex.: Google OAuth)
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email IS NOT NULL THEN
    UPDATE public.orders
    SET user_id = NEW.id
    WHERE user_id IS NULL
      AND LOWER(customer_email) = LOWER(NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL
     AND NEW.email_confirmed_at IS NOT NULL
     AND NEW.email IS NOT NULL THEN
    UPDATE public.orders
    SET user_id = NEW.id
    WHERE user_id IS NULL
      AND LOWER(customer_email) = LOWER(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_user_email_confirmed() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.prevent_profile_role_escalation();

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_user_email_confirmed();

-- Backfill seguro de usuários já existentes em auth.users
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  LOWER(COALESCE(u.email, '')),
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data ->> 'name'), ''),
    SPLIT_PART(COALESCE(u.email, ''), '@', 1)
  ),
  CASE
    WHEN COALESCE(u.raw_app_meta_data ->> 'role', '') = 'admin' THEN 'admin'
    ELSE 'customer'
  END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 8. Habilitar RLS em todas as tabelas e aplicar políticas endurecidas (sem sobreposição)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Cliente lê próprio perfil" ON public.profiles;
CREATE POLICY "Cliente lê próprio perfil" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "Cliente cria próprio perfil" ON public.profiles;
CREATE POLICY "Cliente cria próprio perfil" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id AND role = 'customer');

DROP POLICY IF EXISTS "Cliente atualiza próprio perfil" ON public.profiles;
CREATE POLICY "Cliente atualiza próprio perfil" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Customer Addresses
DROP POLICY IF EXISTS "Cliente gerencia próprios endereços" ON public.customer_addresses;
CREATE POLICY "Cliente gerencia próprios endereços" ON public.customer_addresses
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Customer Wishlists
DROP POLICY IF EXISTS "Cliente gerencia próprios favoritos" ON public.customer_wishlists;
CREATE POLICY "Cliente gerencia próprios favoritos" ON public.customer_wishlists
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Categories (leitura pública; escrita restrita exclusivamente a admins)
DROP POLICY IF EXISTS "Gestão de categorias admin" ON public.categories;
DROP POLICY IF EXISTS "Admin inserção de categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin atualização de categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin exclusão de categorias" ON public.categories;

CREATE POLICY "Admin inserção de categorias" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin atualização de categorias" ON public.categories
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin exclusão de categorias" ON public.categories
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- Products (leitura pública; escrita restrita exclusivamente a admins)
DROP POLICY IF EXISTS "Gestão de produtos" ON public.products;
DROP POLICY IF EXISTS "Gestão de produtos admin" ON public.products;
DROP POLICY IF EXISTS "Admin inserção de produtos" ON public.products;
DROP POLICY IF EXISTS "Admin atualização de produtos" ON public.products;
DROP POLICY IF EXISTS "Admin exclusão de produtos" ON public.products;

CREATE POLICY "Admin inserção de produtos" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin atualização de produtos" ON public.products
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin exclusão de produtos" ON public.products
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- Orders (INSERT bloqueado no RLS — gravação de pedidos ocorre APENAS no servidor via Service Role)
DROP POLICY IF EXISTS "Gestão de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Criação e consulta de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Checkout público de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Gestão de pedidos admin" ON public.orders;
DROP POLICY IF EXISTS "Exclusão de pedidos admin" ON public.orders;
DROP POLICY IF EXISTS "Admin leitura de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin atualização de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin exclusão de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Cliente consulta próprios pedidos" ON public.orders;

CREATE POLICY "Cliente consulta próprios pedidos" ON public.orders
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin())
    OR user_id = (SELECT auth.uid())
    OR (
      user_id IS NULL
      AND (SELECT private.is_email_verified())
      AND LOWER(customer_email) = LOWER(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
    )
  );

CREATE POLICY "Admin atualização de pedidos" ON public.orders
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin exclusão de pedidos" ON public.orders
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- Order Items (INSERT bloqueado no RLS — gravação ocorre APENAS no servidor via Service Role)
DROP POLICY IF EXISTS "Gestão de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Consulta de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Checkout público de itens" ON public.order_items;
DROP POLICY IF EXISTS "Gestão de itens admin" ON public.order_items;
DROP POLICY IF EXISTS "Admin leitura de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Admin atualização de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Admin exclusão de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Cliente consulta itens dos próprios pedidos" ON public.order_items;

CREATE POLICY "Cliente consulta itens dos próprios pedidos" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.user_id = (SELECT auth.uid())
          OR (
            o.user_id IS NULL
            AND (SELECT private.is_email_verified())
            AND LOWER(o.customer_email) = LOWER(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
          )
        )
    )
  );

CREATE POLICY "Admin atualização de itens de pedido" ON public.order_items
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin exclusão de itens de pedido" ON public.order_items
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));
