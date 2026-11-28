import type { KitSettings, KitTier } from '@/types';

export const HARD_MAX_KIT_DISCOUNT_PERCENT = 10;

export const DEFAULT_KIT_SETTINGS: KitSettings = {
  enabled: true,
  title: 'Monte seu Kit EVORAH',
  subtitle:
    'Combine correntes, pulseiras, anéis e pingentes no mesmo estilo e desbloqueie até 10% OFF.',
  minItems: 2,
  maxItems: 5,
  maxDiscountPercent: 10,
  tiers: [
    { minItems: 2, discountPercent: 5 },
    { minItems: 3, discountPercent: 8 },
    { minItems: 4, discountPercent: 10 },
  ],
  allowCouponStacking: false,
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeKitSettings(raw?: Partial<KitSettings> | null): KitSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_KIT_SETTINGS;
  }

  const minItems = Math.floor(clampNumber(Number(raw.minItems ?? DEFAULT_KIT_SETTINGS.minItems), 2, 5, 2));
  const maxItems = Math.floor(
    clampNumber(Number(raw.maxItems ?? DEFAULT_KIT_SETTINGS.maxItems), minItems, 10, Math.max(minItems, 5))
  );
  const maxDiscountPercent = roundCurrency(
    clampNumber(
      Number(raw.maxDiscountPercent ?? DEFAULT_KIT_SETTINGS.maxDiscountPercent),
      0,
      HARD_MAX_KIT_DISCOUNT_PERCENT,
      HARD_MAX_KIT_DISCOUNT_PERCENT
    )
  );

  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers : DEFAULT_KIT_SETTINGS.tiers;
  const deduped = new Map<number, number>();
  for (const t of rawTiers) {
    if (!t || typeof t !== 'object') continue;
    const tierMin = Math.floor(clampNumber(Number(t.minItems), minItems, maxItems, minItems));
    const tierPct = roundCurrency(clampNumber(Number(t.discountPercent), 0, maxDiscountPercent, 0));
    deduped.set(tierMin, tierPct);
  }

  const tiers: KitTier[] = Array.from(deduped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([tierMin, discountPercent]) => ({
      minItems: tierMin,
      discountPercent,
    }));

  const safeTiers: KitTier[] =
    tiers.length > 0
      ? tiers
      : [{ minItems, discountPercent: Math.min(maxDiscountPercent, HARD_MAX_KIT_DISCOUNT_PERCENT) }];

  return {
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : DEFAULT_KIT_SETTINGS.enabled,
    title:
      typeof raw.title === 'string' && raw.title.trim().length > 0
        ? raw.title.trim().slice(0, 80)
        : DEFAULT_KIT_SETTINGS.title,
    subtitle:
      typeof raw.subtitle === 'string' && raw.subtitle.trim().length > 0
        ? raw.subtitle.trim().slice(0, 220)
        : DEFAULT_KIT_SETTINGS.subtitle,
    minItems,
    maxItems,
    maxDiscountPercent,
    tiers: safeTiers,
    allowCouponStacking: Boolean(raw.allowCouponStacking ?? false),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function mapKitSettingsRow(row: Record<string, unknown> | null | undefined): KitSettings {
  if (!row) return DEFAULT_KIT_SETTINGS;

  let parsedTiers: KitTier[] = DEFAULT_KIT_SETTINGS.tiers;
  if (Array.isArray(row.tiers)) {
    parsedTiers = row.tiers as KitTier[];
  } else if (typeof row.tiers === 'string') {
    try {
      const json = JSON.parse(row.tiers);
      if (Array.isArray(json)) parsedTiers = json as KitTier[];
    } catch {
      parsedTiers = DEFAULT_KIT_SETTINGS.tiers;
    }
  }

  return sanitizeKitSettings({
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
    title: typeof row.title === 'string' ? row.title : DEFAULT_KIT_SETTINGS.title,
    subtitle: typeof row.subtitle === 'string' ? row.subtitle : DEFAULT_KIT_SETTINGS.subtitle,
    minItems: Number(row.min_items ?? DEFAULT_KIT_SETTINGS.minItems),
    maxItems: Number(row.max_items ?? DEFAULT_KIT_SETTINGS.maxItems),
    maxDiscountPercent: Number(row.max_discount_percent ?? DEFAULT_KIT_SETTINGS.maxDiscountPercent),
    tiers: parsedTiers,
    allowCouponStacking: Boolean(row.allow_coupon_stacking ?? false),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  });
}

export function calculateKitDiscountPercent(
  kitItemCount: number,
  settings: KitSettings = DEFAULT_KIT_SETTINGS
): number {
  const safe = sanitizeKitSettings(settings);
  if (!safe.enabled || kitItemCount < safe.minItems) return 0;

  let best = 0;
  for (const tier of safe.tiers) {
    if (kitItemCount >= tier.minItems && tier.discountPercent > best) {
      best = tier.discountPercent;
    }
  }

  return Math.min(best, safe.maxDiscountPercent, HARD_MAX_KIT_DISCOUNT_PERCENT);
}

export function getNextKitTier(
  kitItemCount: number,
  settings: KitSettings = DEFAULT_KIT_SETTINGS
): KitTier | null {
  const safe = sanitizeKitSettings(settings);
  if (!safe.enabled) return null;

  const currentDiscount = calculateKitDiscountPercent(kitItemCount, safe);
  for (const tier of safe.tiers) {
    if (tier.minItems > kitItemCount && tier.discountPercent > currentDiscount) {
      return tier;
    }
  }
  return null;
}

export interface OrderDiscountCalculationInput {
  subtotal: number;
  kitSubtotal: number;
  kitItemCount: number;
  couponCode?: string;
  paymentMethod?: 'PIX' | 'CREDIT_CARD';
  kitSettings?: KitSettings;
}

export interface OrderDiscountCalculationResult {
  kitDiscountPercent: number;
  kitDiscount: number;
  couponDiscount: number;
  pixDiscount: number;
  totalDiscount: number;
  total: number;
  kitDiscountCapApplied: boolean;
}

/**
 * Computes exact kit, coupon, and PIX discounts consistently between client and server.
 * Guarantees that kit items NEVER exceed the hard 10% maximum discount cap (even with PIX).
 */
export function calculateOrderDiscounts(
  input: OrderDiscountCalculationInput
): OrderDiscountCalculationResult {
  const safeSettings = sanitizeKitSettings(input.kitSettings);
  const subtotal = roundCurrency(Math.max(0, Number(input.subtotal) || 0));
  const kitSubtotal = roundCurrency(Math.min(subtotal, Math.max(0, Number(input.kitSubtotal) || 0)));
  const regularSubtotal = roundCurrency(Math.max(0, subtotal - kitSubtotal));

  const kitDiscountPercent = calculateKitDiscountPercent(input.kitItemCount, safeSettings);
  const kitDiscount =
    kitDiscountPercent > 0 ? roundCurrency(kitSubtotal * (kitDiscountPercent / 100)) : 0;

  // Cupom promocional não acumula com Kit quando allowCouponStacking = false
  const canApplyCoupon = kitDiscount === 0 || safeSettings.allowCouponStacking;
  const couponUpper = (input.couponCode || '').trim().toUpperCase();
  const couponRate =
    canApplyCoupon && couponUpper === 'BEMVINDO10'
      ? 0.1
      : canApplyCoupon && couponUpper === 'INOX15'
        ? 0.15
        : 0;

  const couponBase = kitDiscount > 0 ? regularSubtotal : subtotal;
  const couponDiscount = couponRate > 0 ? roundCurrency(couponBase * couponRate) : 0;

  let pixDiscount = 0;
  let kitDiscountCapApplied = false;

  if (input.paymentMethod === 'PIX') {
    const regularAfterCoupon = Math.max(0, regularSubtotal - couponDiscount);
    const regularPixDiscount = regularAfterCoupon * 0.05;

    if (kitSubtotal > 0 && kitDiscount > 0) {
      const maxKitDiscountAllowed = kitSubtotal * (Math.min(safeSettings.maxDiscountPercent, HARD_MAX_KIT_DISCOUNT_PERCENT) / 100);
      const remainingKitRoom = Math.max(0, maxKitDiscountAllowed - kitDiscount);
      const uncappedKitPix = Math.max(0, kitSubtotal - kitDiscount) * 0.05;
      const kitPixDiscount = Math.min(uncappedKitPix, remainingKitRoom);
      if (kitPixDiscount < uncappedKitPix - 0.005) {
        kitDiscountCapApplied = true;
      }
      pixDiscount = roundCurrency(regularPixDiscount + kitPixDiscount);
    } else {
      const afterCoupon = Math.max(0, subtotal - couponDiscount);
      pixDiscount = roundCurrency(afterCoupon * 0.05);
    }
  }

  const totalDiscount = roundCurrency(kitDiscount + couponDiscount + pixDiscount);
  const total = roundCurrency(Math.max(0, subtotal - totalDiscount));

  return {
    kitDiscountPercent,
    kitDiscount,
    couponDiscount,
    pixDiscount,
    totalDiscount,
    total,
    kitDiscountCapApplied,
  };
}
