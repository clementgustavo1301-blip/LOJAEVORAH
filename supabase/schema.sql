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

-- Garante coluna payment_id em bancos já existentes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 6. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

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

-- 7. Habilitar RLS e Políticas de Acesso para a Loja e Painel Admin
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categories;
CREATE POLICY "Leitura pública de categorias" ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de categorias admin" ON public.categories;
CREATE POLICY "Gestão de categorias admin" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Gestão de produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.products;
CREATE POLICY "Leitura pública de produtos" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de produtos admin" ON public.products;
CREATE POLICY "Gestão de produtos admin" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura pública de avaliações" ON public.reviews;
CREATE POLICY "Leitura pública de avaliações" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Criação e consulta de pedidos" ON public.orders;
CREATE POLICY "Criação e consulta de pedidos" ON public.orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Checkout público de pedidos" ON public.orders;
CREATE POLICY "Checkout público de pedidos" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Gestão de pedidos admin" ON public.orders;
CREATE POLICY "Gestão de pedidos admin" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Exclusão de pedidos admin" ON public.orders;
CREATE POLICY "Exclusão de pedidos admin" ON public.orders FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Gestão de itens de pedido" ON public.order_items;
DROP POLICY IF EXISTS "Consulta de itens de pedido" ON public.order_items;
CREATE POLICY "Consulta de itens de pedido" ON public.order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Checkout público de itens" ON public.order_items;
CREATE POLICY "Checkout público de itens" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Gestão de itens admin" ON public.order_items;
CREATE POLICY "Gestão de itens admin" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
