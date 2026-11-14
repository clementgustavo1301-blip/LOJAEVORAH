import { LRUCache } from 'lru-cache';
import {
  Product,
  Category,
  Order,
  OrderItem,
  OrderCreatePayload,
  OrderPaymentStatus,
  FulfillmentStatus,
  SupplierPlatform,
  FinishType,
} from '@/types';
import { isSupabaseConfigured } from './supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const LOCAL_PRODUCTS_KEY = 'inox_catalog_products_v3';
const LOCAL_ORDERS_KEY = 'inox_orders_fulfillment_v3';

export const CATEGORY_LOCAL_IMAGE_MAP: Record<string, string> = {
  'cat-aneis': '/images/ring-square.webp',
  'cat-correntes': '/images/chain-grumet.webp',
  'cat-cordoes': '/images/chain-rope.webp',
  'cat-pingentes': '/images/pendant-cross.webp',
  'cat-pulseiras': '/images/bracelet-curb.webp',
  'cat-brincos': '/images/earrings-hoops.webp',
  'cat-acessorios': '/images/chain-gold-rolo.webp',
};

export function detectSupplierPlatform(url?: string, supplierName?: string): SupplierPlatform {
  const combined = `${url || ''} ${supplierName || ''}`.toLowerCase();
  if (combined.includes('shopee') || combined.includes('shp.ee')) return 'SHOPEE';
  if (combined.includes('tiktok')) return 'TIKTOK';
  return 'OTHER';
}

export const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-aneis', name: 'Anéis', slug: 'aneis', description: 'Anéis maciços em Aço 316L', imageUrl: '/images/ring-square.webp', _count: { products: 0 } },
  { id: 'cat-correntes', name: 'Correntes', slug: 'correntes', description: 'Correntes e elos diamantados', imageUrl: '/images/chain-grumet.webp', _count: { products: 0 } },
  { id: 'cat-cordoes', name: 'Cordões', slug: 'cordoes', description: 'Cordões baianos e trançados', imageUrl: '/images/chain-rope.webp', _count: { products: 0 } },
  { id: 'cat-pingentes', name: 'Pingentes', slug: 'pingentes', description: 'Símbolos lapidados à laser', imageUrl: '/images/pendant-cross.webp', _count: { products: 0 } },
  { id: 'cat-pulseiras', name: 'Pulseiras', slug: 'pulseiras', description: 'Braceletes e elos robustos', imageUrl: '/images/bracelet-curb.webp', _count: { products: 0 } },
  { id: 'cat-brincos', name: 'Brincos', slug: 'brincos', description: 'Argolas hipoalergênicas', imageUrl: '/images/earrings-hoops.webp', _count: { products: 0 } },
  { id: 'cat-acessorios', name: 'Acessórios', slug: 'acessorios', description: 'Acessórios unissex', imageUrl: '/images/chain-gold-rolo.webp', _count: { products: 0 } },
];

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-corrente-grumet-2mm',
    name: 'Corrente Grumet Masculina 2 mm',
    slug: 'corrente-grumet-masculina-2mm',
    description: 'Corrente Grumet fina 2 mm confeccionada em Prata 925 legítima. Elos diamantados precisos com brilho espelhado, resistente à água e suor. Fecho boia reforçado.',
    specifications: 'Material: Prata 925 | Espessura: 2 mm | Fecho: Redondo Boia | Peso médio: 8,4g | Comprimento: 60 cm.',
    careInstructions: 'Lavar com água morna e sabão neutro. Secar com flanela macia.',
    material: 'Prata 925',
    price: 348.0,
    promotionalPrice: 179.0,
    rating: 4.94,
    reviewsCount: 683,
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver'],
    availableSizes: ['50cm', '60cm', '70cm'],
    images: ['/images/chain-grumet.webp', '/images/chain-rope.webp'],
    categoryId: 'cat-correntes',
  },
  {
    id: 'prod-corrente-grumet-6mm',
    name: 'Corrente Grumet Diamond Cut 6 mm',
    slug: 'corrente-grumet-diamond-cut-6mm',
    description: 'Corrente em aço inoxidável 316L com elos Grumet chanfrados com corte diamantado. Brilho espelhado que reflete a luz com precisão geométrica. Fecho gaveta duplo.',
    specifications: 'Material: Aço Cirúrgico 316L | Espessura: 6 mm | Fecho: Gaveta duplo | Peso médio: 48g | À prova d’água.',
    careInstructions: 'Lavar com água morna e sabão neutro.',
    material: 'Aço Cirúrgico 316L',
    price: 298.0,
    promotionalPrice: 159.9,
    rating: 4.9,
    reviewsCount: 142,
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'gold', 'black'],
    availableSizes: ['50cm', '60cm', '70cm'],
    images: ['/images/chain-grumet.webp', '/images/chain-rope.webp'],
    categoryId: 'cat-correntes',
  },
  {
    id: 'prod-anel-monolitico-quadrado',
    name: 'Anel Monolítico Quadrado Chanfrado',
    slug: 'anel-monolitico-quadrado-chanfrado',
    description: 'Anel de topo reto geométrico, forjado em bloco maciço de Prata 925. Perfil anatômico interno para conforto superior durante o dia inteiro.',
    specifications: 'Material: Prata 925 | Largura do topo: 14 mm | Anatômico.',
    careInstructions: 'Armazenar em estojo seco.',
    material: 'Prata 925',
    price: 258.0,
    promotionalPrice: 129.9,
    rating: 4.88,
    reviewsCount: 96,
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'black', 'gold'],
    availableSizes: ['18', '20', '22', '24', '26'],
    images: ['/images/ring-square.webp', '/images/ring-black.webp'],
    categoryId: 'cat-aneis',
  },
  {
    id: 'prod-pulseira-grumet-5mm',
    name: 'Pulseira Grumet 5 mm Fecho Gaveta',
    slug: 'pulseira-grumet-5mm-fecho-gaveta',
    description: 'Pulseira em Aço Cirúrgico 316L com elos Grumet maciços e fecho de segurança tipo gaveta. Resistente a maresia, suor e piscina.',
    specifications: 'Material: Aço Cirúrgico 316L | Espessura: 5 mm | Fecho: Gaveta com trava.',
    careInstructions: 'Lavar normalmente com sabão neutro.',
    material: 'Aço Cirúrgico 316L',
    price: 278.0,
    promotionalPrice: 139.0,
    rating: 4.96,
    reviewsCount: 312,
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'gold'],
    availableSizes: ['18cm', '20cm', '22cm'],
    images: ['/images/bracelet-curb.webp'],
    categoryId: 'cat-pulseiras',
  },
  {
    id: 'prod-pingente-cruz-chanfrada',
    name: 'Pingente Cruz Minimalista Chanfrada',
    slug: 'pingente-cruz-minimalista-chanfrada',
    description: 'Design escultural contemporâneo de proporções equilibradas em Prata 925. Arestas chanfradas lapidadas à laser.',
    specifications: 'Material: Prata 925 | Altura: 32 mm | Largura: 18 mm.',
    careInstructions: 'Secar com flanela mágica.',
    material: 'Prata 925',
    price: 178.0,
    promotionalPrice: 89.9,
    rating: 4.92,
    reviewsCount: 184,
    isNew: false,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'gold', 'black'],
    availableSizes: ['Tamanho Único'],
    images: ['/images/pendant-cross.webp'],
    categoryId: 'cat-pingentes',
  },
  {
    id: 'prod-brinco-argola-articulada',
    name: 'Brinco Argola Articulada Click 14 mm',
    slug: 'brinco-argola-articulada-click-14mm',
    description: 'Par de argolas em perfil quadrado minimalista com fecho click articulado em Aço Cirúrgico 316L hipoalergênico.',
    specifications: 'Material: Aço Cirúrgico 316L | Diâmetro externo: 14 mm | Espessura: 2.5 mm.',
    careInstructions: 'Uso contínuo seguro.',
    material: 'Aço Cirúrgico 316L',
    price: 138.0,
    promotionalPrice: 69.9,
    rating: 4.98,
    reviewsCount: 228,
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'black', 'gold'],
    availableSizes: ['12mm', '14mm', '16mm'],
    images: ['/images/earrings-hoops.webp'],
    categoryId: 'cat-brincos',
  },
  {
    id: 'prod-cordao-baiano-trancado',
    name: 'Cordão Baiano Trançado 3 mm',
    slug: 'cordao-baiano-trancado-3mm',
    description: 'Cordão com trança espiral torcida em Prata 925 com acabamento premium e fecho lagosta reforçado.',
    specifications: 'Material: Prata 925 | Espessura: 3 mm | Fecho: Lagosta.',
    careInstructions: 'Limpar com água morna e secar bem.',
    material: 'Prata 925',
    price: 338.0,
    promotionalPrice: 169.0,
    rating: 4.95,
    reviewsCount: 415,
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    availableFinishes: ['silver', 'gold'],
    availableSizes: ['50cm', '60cm'],
    images: ['/images/chain-rope.webp', '/images/chain-gold-rolo.webp'],
    categoryId: 'cat-cordoes',
  },
  {
    id: 'prod-corrente-elo-portugues',
    name: 'Corrente Elo Português Circular 4 mm',
    slug: 'corrente-elo-portugues-circular-4mm',
    description: 'Elos redondos entrelaçados em Aço Cirúrgico 316L polido. Toque macio e caimento fluido para composições.',
    specifications: 'Material: Aço Cirúrgico 316L | Espessura: 4 mm | Fecho: Lagosta reforçado.',
    careInstructions: 'À prova d’água e maresia.',
    material: 'Aço Cirúrgico 316L',
    price: 298.0,
    promotionalPrice: 149.0,
    rating: 4.88,
    reviewsCount: 78,
    isNew: false,
    isBestSeller: false,
    isFeatured: true,
    availableFinishes: ['silver', 'gold'],
    availableSizes: ['45cm', '50cm', '60cm'],
    images: ['/images/chain-gold-rolo.webp'],
    categoryId: 'cat-correntes',
  },
];

// --- Local Persistence Helpers (for instant sync with or without Supabase) ---
function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return FALLBACK_PRODUCTS;
  try {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return FALLBACK_PRODUCTS;
}

function saveStoredProducts(list: Product[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return FALLBACK_ORDERS;
  try {
    const raw = window.localStorage.getItem(LOCAL_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return FALLBACK_ORDERS;
}

function saveStoredOrders(list: Order[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

// --- Supabase Data Mappers ---
function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    imageUrl: row.image_url || '',
    _count: row.products ? { products: Array.isArray(row.products) ? row.products.length : (row.products.count ?? 0) } : undefined,
  };
}

function mapProduct(row: any): Product {
  const finishes = Array.isArray(row.available_finishes)
    ? row.available_finishes
    : (typeof row.available_finishes === 'string' ? JSON.parse(row.available_finishes || '[]') : ['silver']);
  const sizes = Array.isArray(row.available_sizes)
    ? row.available_sizes
    : (typeof row.available_sizes === 'string' ? JSON.parse(row.available_sizes || '[]') : []);
  const images = Array.isArray(row.images)
    ? row.images
    : (typeof row.images === 'string' ? JSON.parse(row.images || '[]') : []);

  const supplierName = row.supplier_name || undefined;
  const supplierUrl = row.supplier_url || undefined;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    specifications: row.specifications || '',
    careInstructions: row.care_instructions || '',
    material: row.material || 'Aço Cirúrgico 316L',
    price: Number(row.price),
    promotionalPrice: row.promotional_price !== null && row.promotional_price !== undefined ? Number(row.promotional_price) : null,
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || 0),
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    isFeatured: Boolean(row.is_featured),
    availableFinishes: finishes,
    availableSizes: sizes,
    images: images,
    categoryId: row.category_id,
    category: row.category ? mapCategory(row.category) : undefined,
    supplierName,
    supplierUrl,
    supplierCost: row.supplier_cost !== null && row.supplier_cost !== undefined ? Number(row.supplier_cost) : undefined,
    supplierPlatform: detectSupplierPlatform(supplierUrl, supplierName),
    estimatedDeliveryDays: row.estimated_delivery_days || undefined,
  };
}

const CACHE_TTL_MS = 120_000;
const SUPABASE_TIMEOUT_MS = 4500;
const BACKEND_TIMEOUT_MS = 200;
const SUPABASE_COOLDOWN_MS = 15_000;
const SUPABASE_DOWN_STORAGE_KEY = 'evorah_supabase_down_until';
const BACKEND_DOWN_STORAGE_KEY = 'evorah_backend_down_until';

const serverCache = new LRUCache<string, Product[] | Category[]>({
  max: 24,
  ttl: CACHE_TTL_MS,
});

// Pré-popula o cache em memória quando o Supabase remoto está desativado para resposta SSR em 0ms
if (!isSupabaseConfigured()) {
  serverCache.set('products', FALLBACK_PRODUCTS);
  serverCache.set('categories', FALLBACK_CATEGORIES);
}

let productsInFlight: Promise<Product[]> | null = null;
let ordersInFlight: Promise<Order[]> | null = null;
const productSlugInFlight = new Map<string, Promise<Product | null>>();
let supabaseDownUntil = isSupabaseConfigured() ? 0 : Number.MAX_SAFE_INTEGER;
let backendDownUntil = 0;

function getCooldownUntil(inMemoryUntil: number, storageKey: string): number {
  const now = Date.now();
  if (now <= inMemoryUntil) return inMemoryUntil;
  if (typeof window !== 'undefined') {
    try {
      const stored = Number(
        window.localStorage.getItem(storageKey) ||
          window.sessionStorage.getItem(storageKey) ||
          '0'
      );
      if (now <= stored) return stored;
    } catch {
      // Ignore storage access restrictions
    }
  }
  return 0;
}

function isSupabaseDown(): boolean {
  if (!isSupabaseConfigured()) return true;
  const until = getCooldownUntil(supabaseDownUntil, SUPABASE_DOWN_STORAGE_KEY);
  supabaseDownUntil = until;
  return Date.now() <= until;
}

function markSupabaseDown() {
  supabaseDownUntil = Date.now() + SUPABASE_COOLDOWN_MS;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SUPABASE_DOWN_STORAGE_KEY, String(supabaseDownUntil));
      window.sessionStorage.setItem(SUPABASE_DOWN_STORAGE_KEY, String(supabaseDownUntil));
    } catch {
      // Ignore storage access restrictions
    }
  }
}

function isBackendDown(): boolean {
  const until = getCooldownUntil(backendDownUntil, BACKEND_DOWN_STORAGE_KEY);
  backendDownUntil = until;
  return Date.now() <= until;
}

function markBackendDown() {
  backendDownUntil = Date.now() + SUPABASE_COOLDOWN_MS;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(BACKEND_DOWN_STORAGE_KEY, String(backendDownUntil));
    } catch {
      // Ignore storage access restrictions
    }
  }
}

export function getStoredProductsSnapshot(): Product[] {
  const cached = serverCache.get('products') as Product[] | undefined;
  if (cached && cached.length > 0) return cached;
  return getStoredProducts();
}

export function getStoredOrdersSnapshot(): Order[] {
  return getStoredOrders();
}

async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = SUPABASE_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Supabase timeout')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function runSupabaseTask<T>(
  task: (supabase: NonNullable<Awaited<ReturnType<typeof import('./supabase/client')['getSupabaseBrowserClient']>>>) => Promise<T>,
  timeoutMs = SUPABASE_TIMEOUT_MS
): Promise<T | null> {
  if (isSupabaseDown()) return null;
  try {
    const { getSupabaseBrowserClient } = await import('./supabase/client');
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    return await withTimeout(task(supabase), timeoutMs);
  } catch {
    markSupabaseDown();
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const cached = serverCache.get('categories') as Category[] | undefined;
  if (cached && cached.length > 0) {
    return cached;
  }

  const supabaseCategories = await runSupabaseTask(async (supabase) => {
    const { data, error } = await supabase.from('categories').select('*, products(id)').order('name');
    if (error || !data || data.length === 0) {
      if (error) markSupabaseDown();
      return null;
    }
    return data.map(mapCategory);
  });

  if (supabaseCategories && supabaseCategories.length > 0) {
    serverCache.set('categories', supabaseCategories);
    return supabaseCategories;
  }

  if (API_BASE_URL && !isBackendDown()) {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      });
      if (res.ok) {
        const json = await res.json();
        serverCache.set('categories', json);
        return json;
      }
      markBackendDown();
    } catch {
      markBackendDown();
    }
  }

  return FALLBACK_CATEGORIES;
}

function filterAndSortProducts(
  source: Product[],
  params?: {
    category?: string;
    finish?: string;
    search?: string;
    sort?: string;
    featured?: boolean;
    bestSeller?: boolean;
    isNew?: boolean;
  }
): Product[] {
  let result = [...source];
  if (params?.featured) {
    result = result.filter(p => p.isFeatured);
  }
  if (params?.category) {
    result = result.filter(
      p =>
        p.categoryId === `cat-${params.category}` ||
        p.categoryId === params.category ||
        p.category?.slug === params.category ||
        p.slug.includes(params.category!)
    );
  }
  if (params?.finish) {
    result = result.filter(p => p.availableFinishes.includes(params.finish as FinishType));
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (params?.bestSeller) {
    result = result.filter(p => p.isBestSeller);
  }
  if (params?.isNew) {
    result = result.filter(p => p.isNew);
  }
  if (params?.sort === 'price_asc') {
    result.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
  } else if (params?.sort === 'price_desc') {
    result.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
  } else if (params?.sort === 'rating') {
    result.sort((a, b) => b.rating - a.rating);
  }
  return result;
}

export async function fetchProducts(params?: {
  category?: string;
  finish?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
}): Promise<Product[]> {
  const cached = serverCache.get('products') as Product[] | undefined;
  if (cached && cached.length > 0) {
    return filterAndSortProducts(cached, params);
  }

  if (!isSupabaseDown()) {
    if (!productsInFlight) {
      productsInFlight = (async () => {
        const result = await runSupabaseTask(async (supabase) => {
          const { data, error } = await supabase
            .from('products')
            .select('*, category:categories(*)')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(mapProduct);
            serverCache.set('products', mapped);
            return mapped;
          }
          markSupabaseDown();
          return null;
        });
        return result ?? getStoredProducts();
      })().finally(() => {
        productsInFlight = null;
      });
    }
    const list = await productsInFlight;
    return filterAndSortProducts(list, params);
  }

  return filterAndSortProducts(getStoredProducts(), params);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const cached = serverCache.get('products') as Product[] | undefined;
  if (cached && cached.length > 0) {
    const cachedHit = cached.find(p => p.slug === slug);
    if (cachedHit) return cachedHit;
  }

  if (!isSupabaseDown()) {
    const existing = productSlugInFlight.get(slug);
    if (existing) return existing;

    const req = (async () => {
      const hit = await runSupabaseTask(async (supabase) => {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:categories(*), reviews(*)')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          return mapProduct(data);
        }
        if (error) markSupabaseDown();
        return null;
      });
      return hit ?? (getStoredProducts().find(p => p.slug === slug) || null);
    })().finally(() => {
      productSlugInFlight.delete(slug);
    });
    productSlugInFlight.set(slug, req);
    return req;
  }
  return getStoredProducts().find(p => p.slug === slug) || null;
}

function buildLocalOrderItems(items: OrderCreatePayload['items'], catalog: Product[]): OrderItem[] {
  const firstProduct = catalog.find((p) => p.id === items[0]?.productId);
  const primarySupplierName = firstProduct?.supplierName || 'Shopee Brasil (Loja Oficial Inox SP)';
  const primarySupplierUrl = firstProduct?.supplierUrl || 'https://shopee.com.br';

  return items.map((item) => {
    const prod = catalog.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: prod ? prod.name : 'Joia Aço Inox 316L',
      finish: item.finish,
      size: item.size || null,
      unitPrice: prod ? (prod.promotionalPrice || prod.price) : 129.9,
      quantity: item.quantity,
      supplierName: prod?.supplierName || primarySupplierName,
      supplierUrl: prod?.supplierUrl || primarySupplierUrl,
      supplierCost: prod?.supplierCost ?? 25.0,
    };
  });
}

export function saveCompletedOrderLocally(params: {
  orderNumber: string;
  payload: OrderCreatePayload;
  paymentStatus: OrderPaymentStatus;
  paymentId?: string;
  total: number;
  subtotal: number;
  discount: number;
}) {
  const catalog = getStoredProducts();
  const mappedItems = buildLocalOrderItems(params.payload.items, catalog);
  const firstProduct = catalog.find((p) => p.id === params.payload.items[0]?.productId);

  const newLocalOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: params.orderNumber,
    customerName: params.payload.customerName,
    customerEmail: params.payload.customerEmail,
    customerPhone: params.payload.customerPhone,
    shippingAddress: params.payload.shippingAddress,
    shippingMethod: params.payload.shippingMethod || 'Expresso',
    paymentMethod: params.payload.paymentMethod,
    paymentStatus: params.paymentStatus,
    paymentId: params.paymentId,
    subtotal: params.subtotal,
    shippingCost: 0,
    discount: params.discount,
    total: params.total,
    installments: params.payload.installments || 1,
    createdAt: new Date().toISOString(),
    fulfillmentStatus: 'PENDING_SUPPLIER',
    supplierName: firstProduct?.supplierName || 'Shopee Brasil (Loja Oficial Inox SP)',
    supplierUrl: firstProduct?.supplierUrl || 'https://shopee.com.br',
    items: mappedItems,
  };

  const currentOrders = getStoredOrders().filter((o) => o.orderNumber !== params.orderNumber);
  saveStoredOrders([newLocalOrder, ...currentOrders]);
  return newLocalOrder;
}

export function updateStoredOrderPaymentStatus(
  orderNumber: string,
  paymentStatus: OrderPaymentStatus,
  paymentId?: string
): Order[] {
  const current = getStoredOrders();
  let changed = false;
  const updated = current.map((order) => {
    if (order.orderNumber !== orderNumber) return order;
    if (order.paymentStatus === paymentStatus && (!paymentId || order.paymentId === paymentId)) {
      return order;
    }
    changed = true;
    return {
      ...order,
      paymentStatus,
      paymentId: paymentId || order.paymentId,
    };
  });
  if (changed) {
    saveStoredOrders(updated);
  }
  return updated;
}

export async function createOrder(
  payload: OrderCreatePayload & { simulatedOutcome?: 'approved' | 'pending' }
) {
  const catalog = getStoredProducts();
  const orderNumber =
    payload.orderNumber ||
    `INX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

  const enrichedItems = payload.items.map((it) => {
    const prod = catalog.find((p) => p.id === it.productId);
    return {
      ...it,
      fallbackName: prod?.name,
      fallbackPrice: prod ? prod.promotionalPrice || prod.price : undefined,
    };
  });

  const endpoint =
    payload.paymentMethod === 'PIX' ? '/api/checkout/pix' : '/api/checkout/card';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      customerCpf: payload.customerCpf,
      shippingAddress: payload.shippingAddress,
      shippingMethod: payload.shippingMethod || 'Expresso',
      paymentMethod: payload.paymentMethod,
      items: enrichedItems,
      couponCode: payload.couponCode,
      simulatedOutcome: payload.simulatedOutcome,
      installments: payload.installments || 1,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Não foi possível processar o pagamento.');
  }

  const finalOrderNumber = String(data.orderNumber || orderNumber);
  const paymentStatus: OrderPaymentStatus = data.paymentStatus || (payload.paymentMethod === 'PIX' ? 'PENDING' : 'PAID');
  const subtotal = Number(data.subtotal || payload.subtotal || 0);
  const discount = Number(data.discount || payload.discount || 0);
  const total = Number(data.total || payload.total || 0);

  const localOrder = saveCompletedOrderLocally({
    orderNumber: finalOrderNumber,
    payload,
    paymentStatus,
    paymentId: data.paymentId ? String(data.paymentId) : undefined,
    total,
    subtotal,
    discount,
  });

  return {
    success: true,
    id: localOrder.id,
    orderNumber: finalOrderNumber,
    paymentId: data.paymentId ? String(data.paymentId) : undefined,
    paymentStatus,
    simulated: Boolean(data.simulated),
    total,
    subtotal,
    discount,
    shippingCost: 0,
    paymentMethod: payload.paymentMethod,
    customerEmail: payload.customerEmail,
    createdAt: localOrder.createdAt,
    pixQrCode: data.pixCode,
    pixQrCodeBase64: data.pixQrCodeBase64,
    pixCode: data.pixCode,
    ticketUrl: data.ticketUrl,
  };
}

// ==============================================================================
// DROPSHIPPING & FULFILLMENT SERVICES (SHOPEE / TIKTOK SHOP / MULTI-SUPPLIER)
// ==============================================================================

function mapOrder(row: any): Order {
  const address = typeof row.shipping_address === 'string'
    ? JSON.parse(row.shipping_address)
    : (row.shipping_address || {});

  const catalog = getStoredProducts();

  const items: OrderItem[] = Array.isArray(row.items)
    ? row.items.map((it: any) => {
        const matchedProd = catalog.find(p => p.id === it.product_id || p.name === it.product_name);
        return {
          id: it.id,
          orderId: it.order_id,
          productId: it.product_id || matchedProd?.id || '',
          productName: it.product_name || 'Joia Aço Inox',
          finish: it.finish || 'silver',
          size: it.size || null,
          unitPrice: Number(it.unit_price || 0),
          quantity: Number(it.quantity || 1),
          supplierName: it.supplier_name || matchedProd?.supplierName || row.supplier_name,
          supplierUrl: it.supplier_url || matchedProd?.supplierUrl || row.supplier_url,
          supplierCost: matchedProd?.supplierCost ?? 25.0,
        };
      })
    : [];

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: address,
    shippingMethod: row.shipping_method || 'Expresso',
    paymentMethod: row.payment_method || 'PIX',
    paymentStatus: (row.payment_status as OrderPaymentStatus) || 'PENDING',
    paymentId: row.payment_id || undefined,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total),
    installments: row.installments || 1,
    createdAt: row.created_at,
    items,
    fulfillmentStatus: (row.fulfillment_status as FulfillmentStatus) || 'PENDING_SUPPLIER',
    supplierOrderId: row.supplier_order_id,
    supplierName: row.supplier_name || items[0]?.supplierName || 'Shopee Brasil',
    supplierUrl: row.supplier_url || items[0]?.supplierUrl,
    trackingCode: row.tracking_code,
    trackingCarrier: row.tracking_carrier || 'Shopee Xpress (SPX)',
  };
}

export const FALLBACK_ORDERS: Order[] = [
  {
    id: 'ord-inx-778169-773',
    orderNumber: 'INX-778169-773',
    customerName: 'Alexandre Silva',
    customerEmail: 'alexandre@email.com',
    customerPhone: '(11) 98765-4321',
    shippingAddress: {
      cep: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      number: '1000',
      street: 'Avenida Paulista',
      complement: 'Apto 102',
      neighborhood: 'Bela Vista',
    },
    shippingMethod: 'Expresso Seguro',
    paymentMethod: 'PIX',
    paymentStatus: 'PAID',
    subtotal: 99.9,
    shippingCost: 24.9,
    discount: 5.0,
    total: 119.8,
    installments: 1,
    createdAt: new Date().toISOString(),
    fulfillmentStatus: 'PENDING_SUPPLIER',
    supplierName: 'TikTok Shop Brasil',
    supplierUrl: 'https://www.tiktok.com',
    items: [
      {
        productId: 'prod-corrente-grumet-2mm',
        productName: 'Corrente Grumet Masculina 2 mm',
        finish: 'silver',
        size: '60cm',
        unitPrice: 99.9,
        quantity: 1,
        supplierName: 'TikTok Shop Brasil',
        supplierUrl: 'https://www.tiktok.com',
        supplierCost: 23.99,
      },
    ],
  },
];

export async function fetchOrders(): Promise<Order[]> {
  if (!isSupabaseDown()) {
    if (!ordersInFlight) {
      ordersInFlight = (async () => {
        const remoteOrders = await runSupabaseTask(async (supabase) => {
          const { data, error } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .order('created_at', { ascending: false });

          if (error) {
            markSupabaseDown();
            return null;
          }
          return data ? data.map(mapOrder) : null;
        });

        if (remoteOrders && remoteOrders.length > 0) {
          return remoteOrders;
        }
        return getStoredOrders();
      })().finally(() => {
        ordersInFlight = null;
      });
    }
    return ordersInFlight;
  }

  return getStoredOrders();
}

export async function fetchOrderByTrackingOrNumber(query: string): Promise<Order | null> {
  const clean = query.trim().toUpperCase();
  const remoteOrder = await runSupabaseTask(async (supabase) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .or(`order_number.ilike.%${clean}%,customer_email.ilike.%${clean}%,tracking_code.ilike.%${clean}%`)
      .maybeSingle();

    if (error) {
      markSupabaseDown();
      return null;
    }
    return data ? mapOrder(data) : null;
  });

  if (remoteOrder) return remoteOrder;

  const localHit =
    getStoredOrders().find(
      (o) =>
        o.orderNumber.toUpperCase().includes(clean) ||
        o.customerEmail.toUpperCase().includes(clean) ||
        (o.trackingCode && o.trackingCode.toUpperCase().includes(clean))
    ) || null;

  if (localHit && typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(localHit.orderNumber)}/status`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const statusData = await res.json();
        if (statusData?.found && statusData.paymentStatus) {
          updateStoredOrderPaymentStatus(
            localHit.orderNumber,
            statusData.paymentStatus,
            statusData.paymentId
          );
          return {
            ...localHit,
            paymentStatus: statusData.paymentStatus,
            paymentId: statusData.paymentId || localHit.paymentId,
          };
        }
      }
    } catch {
      // Mantém snapshot local se consulta de status falhar
    }
  }

  return localHit;
}

export async function syncPendingOrdersWithServer(orders: Order[]): Promise<Order[]> {
  if (typeof window === 'undefined') return orders;
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'PENDING');
  if (pendingOrders.length === 0) return orders;

  const updates = await Promise.all(
    pendingOrders.map(async (order) => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.found && data.paymentStatus && data.paymentStatus !== order.paymentStatus) {
          return {
            orderNumber: order.orderNumber,
            paymentStatus: data.paymentStatus as OrderPaymentStatus,
            paymentId: data.paymentId as string | undefined,
          };
        }
      } catch {
        // Ignora erro pontual de rede
      }
      return null;
    })
  );

  let result = orders;
  for (const upd of updates) {
    if (upd) {
      result = updateStoredOrderPaymentStatus(upd.orderNumber, upd.paymentStatus, upd.paymentId);
    }
  }
  return result;
}

export async function updateOrderFulfillment(
  orderId: string,
  data: {
    fulfillmentStatus: FulfillmentStatus;
    supplierOrderId?: string;
    supplierName?: string;
    trackingCode?: string;
    trackingCarrier?: string;
    supplierUrl?: string;
  }
): Promise<boolean> {
  const orders = getStoredOrders();
  const updatedOrders = orders.map((order) => {
    if (order.id === orderId || order.orderNumber === orderId) {
      return {
        ...order,
        fulfillmentStatus: data.fulfillmentStatus,
        supplierOrderId: data.supplierOrderId !== undefined ? data.supplierOrderId : order.supplierOrderId,
        supplierName: data.supplierName !== undefined ? data.supplierName : order.supplierName,
        trackingCode: data.trackingCode !== undefined ? data.trackingCode : order.trackingCode,
        trackingCarrier: data.trackingCarrier !== undefined ? data.trackingCarrier : order.trackingCarrier,
        supplierUrl: data.supplierUrl !== undefined ? data.supplierUrl : order.supplierUrl,
      };
    }
    return order;
  });
  saveStoredOrders(updatedOrders);

  void runSupabaseTask(async (supabase) => {
    await supabase
      .from('orders')
      .update({
        fulfillment_status: data.fulfillmentStatus,
        supplier_order_id: data.supplierOrderId,
        supplier_name: data.supplierName,
        tracking_code: data.trackingCode,
        tracking_carrier: data.trackingCarrier || 'Shopee Xpress (SPX)',
        supplier_url: data.supplierUrl,
      })
      .eq('id', orderId);
    return true;
  });

  return true;
}

export async function updateProductSupplier(
  productId: string,
  data: {
    name?: string;
    description?: string;
    supplierName?: string;
    supplierUrl?: string;
    supplierCost?: number;
    estimatedDeliveryDays?: string;
    price?: number;
    promotionalPrice?: number | null;
    images?: string[];
  }
): Promise<boolean> {
  const list = getStoredProducts();
  const updated = list.map((prod) => {
    if (prod.id === productId) {
      const nextUrl = data.supplierUrl !== undefined ? data.supplierUrl : prod.supplierUrl;
      const nextSupplier = data.supplierName !== undefined ? data.supplierName : prod.supplierName;
      return {
        ...prod,
        name: data.name !== undefined ? data.name : prod.name,
        description: data.description !== undefined ? data.description : prod.description,
        supplierName: nextSupplier,
        supplierUrl: nextUrl,
        supplierCost: data.supplierCost !== undefined ? data.supplierCost : prod.supplierCost,
        supplierPlatform: detectSupplierPlatform(nextUrl, nextSupplier),
        estimatedDeliveryDays: data.estimatedDeliveryDays !== undefined ? data.estimatedDeliveryDays : prod.estimatedDeliveryDays,
        price: data.price !== undefined ? data.price : prod.price,
        promotionalPrice: data.promotionalPrice !== undefined ? data.promotionalPrice : prod.promotionalPrice,
        images: data.images !== undefined ? data.images : prod.images,
      };
    }
    return prod;
  });
  saveStoredProducts(updated);
  serverCache.delete('products');

  void runSupabaseTask(async (supabase) => {
    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.supplierName !== undefined) updatePayload.supplier_name = data.supplierName;
    if (data.supplierUrl !== undefined) updatePayload.supplier_url = data.supplierUrl;
    if (data.supplierCost !== undefined) updatePayload.supplier_cost = data.supplierCost;
    if (data.estimatedDeliveryDays !== undefined) updatePayload.estimated_delivery_days = data.estimatedDeliveryDays;
    if (data.price !== undefined) updatePayload.price = data.price;
    if (data.promotionalPrice !== undefined) updatePayload.promotional_price = data.promotionalPrice;
    if (data.images !== undefined) updatePayload.images = data.images;

    await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId);
    return true;
  });

  return true;
}

export async function createProductFromImport(payload: {
  name: string;
  description?: string;
  categoryId: string;
  material?: string;
  supplierName: string;
  supplierUrl: string;
  supplierCost: number;
  price: number;
  promotionalPrice?: number | null;
  estimatedDeliveryDays?: string;
  images: string[];
  availableFinishes?: FinishType[];
  availableSizes?: string[];
}): Promise<Product> {
  const slugBase = payload.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  const fallbackImg = CATEGORY_LOCAL_IMAGE_MAP[payload.categoryId] || '/images/chain-grumet.webp';

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name: payload.name,
    slug,
    description:
      payload.description ||
      `${payload.name} em Aço Inoxidável 316L de alta resistência. Acabamento espelhado hipoalergênico à prova d'água, suor e maresia.`,
    specifications: `Material: ${payload.material || 'Aço Cirúrgico 316L'} | Garantia Vitalícia contra oxidação | Hipoalergênico.`,
    careInstructions: 'Lavar com água morna e sabão neutro. Secar com pano macio.',
    material: payload.material || 'Aço Cirúrgico 316L',
    price: payload.price,
    promotionalPrice: payload.promotionalPrice ?? null,
    rating: 5.0,
    reviewsCount: 12,
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    categoryId: payload.categoryId || 'cat-correntes',
    availableFinishes: payload.availableFinishes?.length ? payload.availableFinishes : ['silver', 'gold', 'black'],
    availableSizes: payload.availableSizes?.length ? payload.availableSizes : ['Tamanho Único'],
    supplierName: payload.supplierName,
    supplierUrl: payload.supplierUrl,
    supplierCost: payload.supplierCost,
    supplierPlatform: detectSupplierPlatform(payload.supplierUrl, payload.supplierName),
    estimatedDeliveryDays: payload.estimatedDeliveryDays || '4 a 8 dias úteis (SPX / J&T)',
    images:
      payload.images.filter(Boolean).length > 0
        ? payload.images.filter(Boolean)
        : [fallbackImg],
  };

  // Salva no estado local imediatamente
  const existing = getStoredProducts();
  saveStoredProducts([newProduct, ...existing]);
  serverCache.delete('products');

  // Tenta salvar no Supabase caso esteja conectado
  const remoteCreated = await runSupabaseTask(async (supabase) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        id: newProduct.id,
        name: newProduct.name,
        slug: newProduct.slug,
        description: newProduct.description,
        specifications: newProduct.specifications,
        care_instructions: newProduct.careInstructions,
        material: newProduct.material,
        price: newProduct.price,
        promotional_price: newProduct.promotionalPrice,
        rating: newProduct.rating,
        reviews_count: newProduct.reviewsCount,
        is_new: true,
        is_best_seller: true,
        is_featured: true,
        available_finishes: newProduct.availableFinishes,
        available_sizes: newProduct.availableSizes,
        images: newProduct.images,
        category_id: newProduct.categoryId || 'cat-correntes',
        supplier_name: newProduct.supplierName,
        supplier_url: newProduct.supplierUrl,
        supplier_cost: newProduct.supplierCost,
        estimated_delivery_days: newProduct.estimatedDeliveryDays,
      })
      .select()
      .single();

    if (!error && data) return mapProduct(data);
    if (error) markSupabaseDown();
    return null;
  });

  return remoteCreated ?? newProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const existing = getStoredProducts();
  saveStoredProducts(existing.filter((p) => p.id !== productId));
  serverCache.delete('products');

  void runSupabaseTask(async (supabase) => {
    await supabase.from('products').delete().eq('id', productId);
    return true;
  });

  return true;
}



