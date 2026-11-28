-- ============================================================================
-- SCHEMA COMPLETO SUPABASE (POSTGRESQL) - LOJA JOIAS AÇO INOX 316L + DROPSHIPPING
-- ============================================================================

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Produtos (Catálogo + Vínculo Fornecedor Shopee / TikTok Shop)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('prod-' || extract(epoch from now())::bigint::text),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  specifications TEXT,
  care_instructions TEXT,
  material TEXT NOT NULL DEFAULT 'Aço Cirúrgico 316L',
  price NUMERIC(10, 2) NOT NULL,
  promotional_price NUMERIC(10, 2),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  reviews_count INTEGER NOT NULL DEFAULT 1,
  is_new BOOLEAN NOT NULL DEFAULT TRUE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT TRUE,
  available_finishes JSONB NOT NULL DEFAULT '["silver", "gold", "black"]'::jsonb,
  available_sizes JSONB NOT NULL DEFAULT '["Único"]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_name TEXT,
  supplier_url TEXT,
  supplier_cost NUMERIC(10, 2),
  estimated_delivery_days TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Pedidos (Checkout PIX/Cartão + Fulfillment Dropshipping)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL DEFAULT 'Expresso',
  payment_method TEXT NOT NULL DEFAULT 'PIX',
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_id TEXT,
  fulfillment_status TEXT NOT NULL DEFAULT 'PENDING_SUPPLIER',
  supplier_order_id TEXT,
  supplier_name TEXT,
  supplier_url TEXT,
  tracking_code TEXT,
  tracking_carrier TEXT,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  finish TEXT NOT NULL DEFAULT 'silver',
  size TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  supplier_name TEXT,
  supplier_url TEXT,
  supplier_cost NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.1 Perfis de Usuários (Separação Admin vs Cliente)
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

-- 5.2 Endereços Salvos dos Clientes
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

-- 5.3 Favoritos Sincronizados na Nuvem
CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Garante colunas em bancos já existentes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower ON public.orders(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlists_user_id ON public.customer_wishlists(user_id);

-- Funções e Triggers de Autenticação e Segurança (schema privado não exposto)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

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

-- Habilita Realtime para atualizar a tela de Checkout / Admin quando o Webhook marcar como PAID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 7. Habilitar RLS e Políticas de Acesso para a Loja, Área do Cliente e Painel Admin
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.customer_addresses FROM anon;
REVOKE ALL ON public.customer_wishlists FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.customer_wishlists TO authenticated;

DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categories;
CREATE POLICY "Leitura pública de categorias" ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de categorias admin" ON public.categories;
DROP POLICY IF EXISTS "Admin inserção de categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin atualização de categorias" ON public.categories;
DROP POLICY IF EXISTS "Admin exclusão de categorias" ON public.categories;
CREATE POLICY "Admin inserção de categorias" ON public.categories FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin atualização de categorias" ON public.categories FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin exclusão de categorias" ON public.categories FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Gestão de produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
CREATE POLICY "Leitura pública de produtos" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de produtos admin" ON public.products;
DROP POLICY IF EXISTS "Admin inserção de produtos" ON public.products;
DROP POLICY IF EXISTS "Admin atualização de produtos" ON public.products;
DROP POLICY IF EXISTS "Admin exclusão de produtos" ON public.products;
CREATE POLICY "Admin inserção de produtos" ON public.products FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin atualização de produtos" ON public.products FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin exclusão de produtos" ON public.products FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Leitura pública de avaliações" ON public.reviews;
CREATE POLICY "Leitura pública de avaliações" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Cliente lê próprio perfil" ON public.profiles;
CREATE POLICY "Cliente lê próprio perfil" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "Cliente cria próprio perfil" ON public.profiles;
CREATE POLICY "Cliente cria próprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id AND role = 'customer');

DROP POLICY IF EXISTS "Cliente atualiza próprio perfil" ON public.profiles;
CREATE POLICY "Cliente atualiza próprio perfil" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Cliente gerencia próprios endereços" ON public.customer_addresses;
CREATE POLICY "Cliente gerencia próprios endereços" ON public.customer_addresses FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Cliente gerencia próprios favoritos" ON public.customer_wishlists;
CREATE POLICY "Cliente gerencia próprios favoritos" ON public.customer_wishlists FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Gestão de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Criação e consulta de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Checkout público de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Gestão de pedidos admin" ON public.orders;
DROP POLICY IF EXISTS "Exclusão de pedidos admin" ON public.orders;
DROP POLICY IF EXISTS "Admin leitura de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin atualização de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin exclusão de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Cliente consulta próprios pedidos" ON public.orders;
CREATE POLICY "Cliente consulta próprios pedidos" ON public.orders FOR SELECT TO authenticated USING (
  (SELECT private.is_admin())
  OR user_id = (SELECT auth.uid())
  OR (
    user_id IS NULL
    AND (SELECT private.is_email_verified())
    AND LOWER(customer_email) = LOWER(COALESCE((SELECT auth.jwt()) ->> 'email', ''))
  )
);
CREATE POLICY "Admin atualização de pedidos" ON public.orders FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin exclusão de pedidos" ON public.orders FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Gestão de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Consulta de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Checkout público de itens" ON public.order_items;
DROP POLICY IF EXISTS "Gestão de itens admin" ON public.order_items;
DROP POLICY IF EXISTS "Admin leitura de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Admin atualização de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Admin exclusão de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Cliente consulta itens dos próprios pedidos" ON public.order_items;
CREATE POLICY "Cliente consulta itens dos próprios pedidos" ON public.order_items FOR SELECT TO authenticated USING (
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
CREATE POLICY "Admin atualização de itens de pedido" ON public.order_items FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "Admin exclusão de itens de pedido" ON public.order_items FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

-- 8. Seed Inicial de Categorias
INSERT INTO public.categories (id, name, slug, description, image_url) VALUES
  ('cat-aneis', 'Anéis', 'aneis', 'Anéis maciços em Aço 316L', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'),
  ('cat-correntes', 'Correntes', 'correntes', 'Correntes e elos diamantados', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'),
  ('cat-cordoes', 'Cordões', 'cordoes', 'Cordões baianos e trançados', 'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80'),
  ('cat-pingentes', 'Pingentes', 'pingentes', 'Símbolos lapidados à laser', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80'),
  ('cat-pulseiras', 'Pulseiras', 'pulseiras', 'Braceletes e elos robustos', 'https://images.unsplash.com/photo-1611591475879-7153b664d50d?auto=format&fit=crop&w=800&q=80'),
  ('cat-brincos', 'Brincos', 'brincos', 'Argolas hipoalergênicas', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80'),
  ('cat-acessorios', 'Acessórios', 'acessorios', 'Acessórios unissex', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;
