-- ==============================================================================
-- INOX LUXURY STORE - SUPABASE DATABASE SCHEMA & INITIAL SEED
-- ==============================================================================
-- Instruções de Execução:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Crie ou selecione o seu projeto
-- 3. No menu lateral, acesse "SQL Editor" -> "New Query"
-- 4. Cole todo o conteúdo deste arquivo e clique em "Run" (Executar)
-- ==============================================================================

-- 0. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELAS
-- ==============================================================================

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    specifications TEXT,
    care_instructions TEXT,
    material TEXT NOT NULL DEFAULT 'Aço Cirúrgico 316L',
    price NUMERIC(10, 2) NOT NULL,
    promotional_price NUMERIC(10, 2),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    available_finishes TEXT[] NOT NULL DEFAULT ARRAY['silver']::TEXT[],
    available_sizes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    -- Campos de Dropshipping (Suporta Shopee, AliExpress, Shein, Fábricas Nacionais, etc.)
    supplier_name TEXT DEFAULT 'Fornecedor Parceiro',
    supplier_url TEXT,
    supplier_cost NUMERIC(10, 2),
    estimated_delivery_days TEXT DEFAULT '8 a 15 dias úteis',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_method TEXT NOT NULL DEFAULT 'Expresso',
    payment_method TEXT NOT NULL, -- 'PIX' ou 'CREDIT_CARD'
    payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'CANCELLED'
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    installments INTEGER NOT NULL DEFAULT 1,
    -- Campos de Dropshipping & Fulfillment Multi-Fornecedor
    fulfillment_status TEXT NOT NULL DEFAULT 'PENDING_SUPPLIER', -- 'PENDING_SUPPLIER', 'ORDERED_SUPPLIER', 'SHIPPED', 'DELIVERED'
    supplier_order_id TEXT,
    supplier_name TEXT DEFAULT 'Fornecedor Parceiro',
    supplier_url TEXT,
    tracking_code TEXT,
    tracking_carrier TEXT DEFAULT 'Correios',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    finish TEXT NOT NULL,
    size TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON public.products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

-- ==============================================================================
-- 3. TRIGGER AUTOMÁTICO DE UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_categories ON public.categories;
CREATE TRIGGER trigger_set_updated_at_categories
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_products ON public.products;
CREATE TRIGGER trigger_set_updated_at_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_orders ON public.orders;
CREATE TRIGGER trigger_set_updated_at_orders
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Categorias: Qualquer visitante pode visualizar
DROP POLICY IF EXISTS "Public categories read" ON public.categories;
CREATE POLICY "Public categories read"
    ON public.categories FOR SELECT
    USING (true);

-- Produtos: Qualquer visitante pode visualizar
DROP POLICY IF EXISTS "Public products read" ON public.products;
CREATE POLICY "Public products read"
    ON public.products FOR SELECT
    USING (true);

-- Avaliações: Qualquer visitante pode visualizar e cadastrar
DROP POLICY IF EXISTS "Public reviews read" ON public.reviews;
CREATE POLICY "Public reviews read"
    ON public.reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public reviews insert" ON public.reviews;
CREATE POLICY "Public reviews insert"
    ON public.reviews FOR INSERT
    WITH CHECK (true);

-- Pedidos: Visitantes podem criar pedidos no checkout e consultar seu pedido
DROP POLICY IF EXISTS "Public orders insert" ON public.orders;
CREATE POLICY "Public orders insert"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public orders read" ON public.orders;
CREATE POLICY "Public orders read"
    ON public.orders FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public orders update" ON public.orders;
CREATE POLICY "Public orders update"
    ON public.orders FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Public order_items insert" ON public.order_items;
CREATE POLICY "Public order_items insert"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public order_items read" ON public.order_items;
CREATE POLICY "Public order_items read"
    ON public.order_items FOR SELECT
    USING (true);

-- ==============================================================================
-- 5. STORAGE BUCKET PARA IMAGENS DE PRODUTOS
-- ==============================================================================
-- Cria o bucket público "products" se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública para o bucket de produtos
DROP POLICY IF EXISTS "Public Access to Product Images" ON storage.objects;
CREATE POLICY "Public Access to Product Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

-- ==============================================================================
-- 6. DADOS INICIAIS (SEED COMPLETO DO CATÁLOGO DE JOIAS INOX)
-- ==============================================================================

-- 6.1 Categorias
INSERT INTO public.categories (id, name, slug, description, image_url)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Anéis', 'aneis', 'Anéis forjados em Aço Cirúrgico 316L de alta precisão e acabamento manual.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000002', 'Correntes', 'correntes', 'Correntes com elos maciços, fechos de segurança e alta durabilidade.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000003', 'Cordões', 'cordoes', 'Cordões trançados baianos e elos singulares para uso diário.', 'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000004', 'Pingentes', 'pingentes', 'Símbolos contemporâneos em relevo e acabamento laser em aço cirúrgico.', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000005', 'Pulseiras', 'pulseiras', 'Braceletes e pulseiras em elos robustos com fechos mecânicos lapidados.', 'https://images.unsplash.com/photo-1611591475879-7153b664d50d?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000006', 'Brincos', 'brincos', 'Argolas articuladas hipoalergênicas que nunca perdem o brilho.', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80'),
    ('a0000000-0000-0000-0000-000000000007', 'Acessórios', 'acessorios', 'Prendedores e complementos monolíticos masculinos e femininos.', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url;

-- 6.2 Produtos
INSERT INTO public.products (
    id, name, slug, description, specifications, care_instructions, material,
    price, promotional_price, rating, reviews_count, is_new, is_best_seller, is_featured,
    available_finishes, available_sizes, images, category_id
)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'Corrente Grumet Diamond Cut 6mm',
    'corrente-grumet-diamond-cut-6mm',
    'Corrente em aço inoxidável 316L com elos Grumet chanfrados com corte diamantado. Brilho espelhado que reflete a luz com precisão geométrica. Fecho gaveta duplo de alta segurança.',
    'Material: Aço Cirúrgico 316L | Espessura: 6mm | Fecho: Gaveta duplo | Peso médio: 48g | À prova d’água e suor.',
    'Lavar com água corrente e sabão neutro. Secar com flanela de microfibra.',
    'Aço Cirúrgico 316L',
    189.90,
    159.90,
    4.90,
    142,
    false,
    true,
    true,
    ARRAY['silver', 'gold', 'black', 'bicolor']::TEXT[],
    ARRAY['50cm', '60cm', '70cm']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000002'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'Anel Monolítico Quadrado Chanfrado',
    'anel-monolitico-quadrado-chanfrado',
    'Anel de topo reto geométrico, forjado em bloco maciço de aço inoxidável. Perfil anatômico interno para conforto superior durante o dia inteiro.',
    'Material: Aço Cirúrgico 316L | Largura do topo: 14mm | Acabamento: Polido e lateral escovada | Anatômico.',
    'Não risca com facilidade e suporta contato diário com água e produtos de higiene.',
    'Aço Cirúrgico 316L',
    129.90,
    99.90,
    4.80,
    96,
    true,
    true,
    true,
    ARRAY['silver', 'gold', 'black']::TEXT[],
    ARRAY['16', '18', '20', '22', '24', '26']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000001'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'Pingente Cruz Minimalista Chanfrada',
    'pingente-cruz-minimalista-chanfrada',
    'Design escultural contemporâneo de proporções equilibradas. Arestas lapidadas à mão que realçam a reflexão do aço cirúrgico.',
    'Material: Aço Cirúrgico 316L | Altura: 32mm | Largura: 18mm | Passador compatível até 7mm.',
    'Garantia permanente contra oxidação e manchas.',
    'Aço Cirúrgico 316L',
    89.90,
    69.90,
    4.90,
    88,
    false,
    true,
    true,
    ARRAY['silver', 'gold', 'black']::TEXT[],
    ARRAY['Único']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000004'
),
(
    'b0000000-0000-0000-0000-000000000004',
    'Corrente Elo Português Circular 4mm',
    'corrente-elo-portugues-circular-4mm',
    'Elos redondos entrelaçados em acabamento PVD Ouro 18k e Aço Polido. Toque macio e caimento fluido ideal para composições.',
    'Material: Aço Cirúrgico 316L com revestimento PVD Íon | Espessura: 4mm | Fecho: Lagosta reforçado.',
    'Banho PVD a vácuo com resistência 10x superior aos banhos convencionais.',
    'Aço Cirúrgico 316L',
    159.90,
    null,
    4.70,
    54,
    true,
    false,
    true,
    ARRAY['silver', 'gold', 'bicolor']::TEXT[],
    ARRAY['45cm', '50cm', '60cm']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000002'
),
(
    'b0000000-0000-0000-0000-000000000005',
    'Brinco Argola Articulada Click 14mm',
    'brinco-argola-articulada-click-14mm',
    'Par de argolas em perfil quadrado minimalista com fecho click articulado. Totalmente hipoalergênicas, perfeitas para uso contínuo.',
    'Material: Aço 316L Cirúrgico | Diâmetro externo: 14mm | Espessura: 2.5mm | Hipoalergênico.',
    'Pode molhar na piscina e no mar sem risco de desbotar.',
    'Aço Cirúrgico 316L',
    69.90,
    49.90,
    5.00,
    167,
    false,
    true,
    true,
    ARRAY['silver', 'gold', 'black']::TEXT[],
    ARRAY['12mm', '14mm', '16mm']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000006'
),
(
    'b0000000-0000-0000-0000-000000000006',
    'Pulseira Grumet Fecho Gaveta Lapidado',
    'pulseira-grumet-fecho-gaveta-lapidado',
    'Pulseira robusta de elos grumet entrelaçados com fecho gravado à laser com a identidade da marca. Sofisticação discreta no pulso.',
    'Material: Aço Cirúrgico 316L | Espessura: 8mm | Comprimento: 19cm e 21cm | Peso: 36g.',
    'Limpeza periódica com pano seco para manutenção do brilho espelhado.',
    'Aço Cirúrgico 316L',
    149.90,
    129.90,
    4.90,
    110,
    false,
    true,
    true,
    ARRAY['silver', 'gold', 'black', 'bicolor']::TEXT[],
    ARRAY['19cm', '21cm']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1611591475879-7153b664d50d?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000005'
),
(
    'b0000000-0000-0000-0000-000000000007',
    'Cordão Baiano Helicoidal 5mm',
    'cordao-baiano-helicoidal-5mm',
    'Cordão com elos espirais de alta densidade que refletem luminosidade contínua em qualquer ângulo. Pesa agradavelmente no peito.',
    'Material: Aço Cirúrgico 316L | Diâmetro: 5mm | Fecho: Garra de Lagosta | Peso: 42g.',
    'Não amassa, não quebra e mantém a integridade estrutural mecânica.',
    'Aço Cirúrgico 316L',
    179.90,
    149.90,
    4.80,
    73,
    true,
    false,
    true,
    ARRAY['silver', 'gold']::TEXT[],
    ARRAY['50cm', '60cm']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1611591475870-760f38b2585f?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000003'
),
(
    'b0000000-0000-0000-0000-000000000008',
    'Anel Black Stealth Titanium PVD',
    'anel-black-stealth-titanium-pvd',
    'Acabamento negro acetinado com ranhura central polida. Revestimento cerâmico de titânio de ultra resistência a atritos.',
    'Material: Aço Inoxidável 316L com revestimento Black Titanium PVD | Largura: 8mm | Borda Chanfrada.',
    'Resistente a riscos e arranhões do cotidiano.',
    'Aço Cirúrgico 316L',
    119.90,
    89.90,
    4.90,
    135,
    false,
    true,
    true,
    ARRAY['black', 'silver']::TEXT[],
    ARRAY['17', '19', '21', '23', '25']::TEXT[],
    ARRAY[
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
    ]::TEXT[],
    'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    specifications = EXCLUDED.specifications,
    price = EXCLUDED.price,
    promotional_price = EXCLUDED.promotional_price,
    images = EXCLUDED.images;

-- 6.3 Avaliações Iniciais dos Produtos
INSERT INTO public.reviews (id, product_id, author_name, rating, comment, verified)
VALUES
(
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000001',
    'Lucas Moreira',
    5,
    'Acabamento impressionante. O corte diamantado brilha muito e o fecho gaveta é extremamente firme.',
    true
),
(
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000001',
    'Gabriel Santos',
    5,
    'Uso todo dia no banho e na academia, não perdeu o brilho nem oxidou. Recomendo demais!',
    true
),
(
    uuid_generate_v4(),
    'b0000000-0000-0000-0000-000000000002',
    'Thiago Alencar',
    5,
    'O anel é maciço de verdade, tem presença sem ser desconfortável por dentro.',
    true
)
ON CONFLICT DO NOTHING;

-- Fim do Script
