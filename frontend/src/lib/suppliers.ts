import { Supplier, SupplierPlatform } from '@/types';

const LOCAL_SUPPLIERS_KEY = 'evorah_suppliers_directory_v1';

export interface SupplierPlatformMeta {
  label: string;
  shortLabel: string;
  defaultSupplierName: string;
  defaultCarrier: string;
  defaultDeliveryDays: string;
  isDirect?: boolean;
}

export const SUPPLIER_PLATFORM_META: Record<SupplierPlatform, SupplierPlatformMeta> = {
  SHOPEE: {
    label: 'Shopee Brasil',
    shortLabel: 'Shopee',
    defaultSupplierName: 'Shopee Brasil',
    defaultCarrier: 'Shopee Xpress (SPX)',
    defaultDeliveryDays: '4 a 8 dias úteis',
  },
  TIKTOK: {
    label: 'TikTok Shop',
    shortLabel: 'TikTok Shop',
    defaultSupplierName: 'TikTok Shop Brasil',
    defaultCarrier: 'J&T Express',
    defaultDeliveryDays: '3 a 6 dias úteis',
  },
  ALIEXPRESS: {
    label: 'AliExpress',
    shortLabel: 'AliExpress',
    defaultSupplierName: 'AliExpress Choice',
    defaultCarrier: 'Cainiao / Correios',
    defaultDeliveryDays: '8 a 15 dias úteis',
  },
  MERCADOLIVRE: {
    label: 'Mercado Livre',
    shortLabel: 'Mercado Livre',
    defaultSupplierName: 'Mercado Livre',
    defaultCarrier: 'Mercado Envios',
    defaultDeliveryDays: '2 a 5 dias úteis',
  },
  SHEIN: {
    label: 'Shein',
    shortLabel: 'Shein',
    defaultSupplierName: 'Shein Brasil',
    defaultCarrier: 'J&T Express',
    defaultDeliveryDays: '5 a 10 dias úteis',
  },
  TEMU: {
    label: 'Temu',
    shortLabel: 'Temu',
    defaultSupplierName: 'Temu Brasil',
    defaultCarrier: 'J&T Express',
    defaultDeliveryDays: '7 a 14 dias úteis',
  },
  DIRECT: {
    label: 'Fornecedor Direto / Atacado',
    shortLabel: 'Direto / Atacado',
    defaultSupplierName: 'Fornecedor Direto / Atacado',
    defaultCarrier: 'Correios',
    defaultDeliveryDays: '2 a 5 dias úteis',
    isDirect: true,
  },
  OTHER: {
    label: 'Site / Fornecedor Externo',
    shortLabel: 'Outros',
    defaultSupplierName: 'Fornecedor Parceiro',
    defaultCarrier: 'Correios',
    defaultDeliveryDays: '4 a 9 dias úteis',
  },
};

export const CARRIER_OPTIONS = [
  'Correios',
  'Shopee Xpress (SPX)',
  'J&T Express',
  'Mercado Envios',
  'Jadlog',
  'Loggi',
  'Total Express',
  'Cainiao / Anjun',
  'Entrega Própria',
];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-atacado-sp',
    name: 'Atacado Inox 316L • São Paulo',
    platform: 'DIRECT',
    websiteUrl: '',
    whatsapp: '',
    email: '',
    defaultCarrier: 'Correios',
    estimatedDeliveryDays: '2 a 5 dias úteis',
    notes: 'Fornecedor direto nacional para correntes, pingentes e sinetes no atacado.',
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'sup-shopee',
    name: 'Shopee Brasil',
    platform: 'SHOPEE',
    websiteUrl: 'https://shopee.com.br',
    defaultCarrier: 'Shopee Xpress (SPX)',
    estimatedDeliveryDays: '4 a 8 dias úteis',
    notes: 'Fornecedores nacionais verificados com envio Shopee Xpress.',
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'sup-tiktok',
    name: 'TikTok Shop Brasil',
    platform: 'TIKTOK',
    websiteUrl: 'https://www.tiktok.com',
    defaultCarrier: 'J&T Express',
    estimatedDeliveryDays: '3 a 6 dias úteis',
    notes: 'Parceiros TikTok Shop com despacho expresso.',
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'sup-mercadolivre',
    name: 'Mercado Livre Full',
    platform: 'MERCADOLIVRE',
    websiteUrl: 'https://www.mercadolivre.com.br',
    defaultCarrier: 'Mercado Envios',
    estimatedDeliveryDays: '2 a 5 dias úteis',
    notes: 'Anúncios Full para reposição rápida.',
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'sup-aliexpress',
    name: 'AliExpress Choice',
    platform: 'ALIEXPRESS',
    websiteUrl: 'https://pt.aliexpress.com',
    defaultCarrier: 'Cainiao / Anjun',
    estimatedDeliveryDays: '8 a 15 dias úteis',
    notes: 'Peças importadas em Aço 316L e Prata 925.',
    isActive: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
];

export function detectSupplierPlatform(url?: string, supplierName?: string): SupplierPlatform {
  const combined = `${url || ''} ${supplierName || ''}`.toLowerCase();
  if (combined.includes('shopee') || combined.includes('shp.ee')) return 'SHOPEE';
  if (combined.includes('tiktok')) return 'TIKTOK';
  if (combined.includes('aliexpress')) return 'ALIEXPRESS';
  if (combined.includes('mercadolivre') || combined.includes('mercadolibre') || combined.includes('meli.')) {
    return 'MERCADOLIVRE';
  }
  if (combined.includes('shein')) return 'SHEIN';
  if (combined.includes('temu')) return 'TEMU';
  if (
    combined.includes('direto') ||
    combined.includes('atacado') ||
    combined.includes('fabrica') ||
    combined.includes('fábrica') ||
    combined.includes('distribuidor') ||
    combined.includes('proprio') ||
    combined.includes('próprio')
  ) {
    return 'DIRECT';
  }
  return 'OTHER';
}

export function resolveSupplierPreset(platform: SupplierPlatform): SupplierPlatformMeta {
  return SUPPLIER_PLATFORM_META[platform] || SUPPLIER_PLATFORM_META.OTHER;
}

export function inferSupplierNameFromUrl(rawUrl: string): string {
  const platform = detectSupplierPlatform(rawUrl);
  if (platform !== 'OTHER' && platform !== 'DIRECT') {
    return SUPPLIER_PLATFORM_META[platform].defaultSupplierName;
  }
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./i, '');
    const base = host.split('.')[0] || 'Fornecedor';
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Fornecedor Parceiro';
  }
}

export function buildWhatsAppHref(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function getStoredSuppliers(): Supplier[] {
  if (typeof window === 'undefined') return DEFAULT_SUPPLIERS;
  try {
    const raw = window.localStorage.getItem(LOCAL_SUPPLIERS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_SUPPLIERS_KEY, JSON.stringify(DEFAULT_SUPPLIERS));
      return DEFAULT_SUPPLIERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read restrictions
  }
  return DEFAULT_SUPPLIERS;
}

export function saveStoredSuppliers(suppliers: Supplier[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_SUPPLIERS_KEY, JSON.stringify(suppliers));
  } catch {
    // Ignore storage quota restrictions
  }
}

export function upsertStoredSupplier(
  input: Omit<Supplier, 'id' | 'createdAt'> & { id?: string }
): Supplier {
  const current = getStoredSuppliers();
  const id = input.id || `sup-${Date.now()}`;
  const existing = current.find((s) => s.id === id);

  const saved: Supplier = {
    id,
    name: input.name.trim(),
    platform: input.platform,
    websiteUrl: input.websiteUrl?.trim() || '',
    whatsapp: input.whatsapp?.trim() || '',
    email: input.email?.trim() || '',
    defaultCarrier: input.defaultCarrier.trim() || 'Correios',
    estimatedDeliveryDays: input.estimatedDeliveryDays.trim() || '3 a 7 dias úteis',
    notes: input.notes?.trim() || '',
    isActive: input.isActive,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const nextList = existing
    ? current.map((s) => (s.id === id ? saved : s))
    : [saved, ...current];

  saveStoredSuppliers(nextList);
  return saved;
}

export function deleteStoredSupplier(id: string): Supplier[] {
  const next = getStoredSuppliers().filter((s) => s.id !== id);
  saveStoredSuppliers(next);
  return next;
}
