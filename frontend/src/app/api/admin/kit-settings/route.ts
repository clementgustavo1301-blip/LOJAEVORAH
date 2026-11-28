import { NextResponse } from 'next/server';
import { getAuthorizedAdminDb } from '@/lib/admin-api-auth';
import {
  DEFAULT_KIT_SETTINGS,
  HARD_MAX_KIT_DISCOUNT_PERCENT,
  mapKitSettingsRow,
  sanitizeKitSettings,
} from '@/lib/kit-pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getAuthorizedAdminDb();
  if ('error' in auth && auth.error) return auth.error;

  const { data, error } = await auth.db
    .from('kit_settings')
    .select(
      'id, enabled, title, subtitle, min_items, max_items, max_discount_percent, tiers, allow_coupon_stacking, updated_at'
    )
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    settings: data ? mapKitSettingsRow(data as Record<string, unknown>) : DEFAULT_KIT_SETTINGS,
  });
}

export async function PUT(req: Request) {
  const auth = await getAuthorizedAdminDb();
  if ('error' in auth && auth.error) return auth.error;

  try {
    const body = await req.json();

    const requestedMaxDiscount = Number(body.maxDiscountPercent ?? HARD_MAX_KIT_DISCOUNT_PERCENT);
    if (requestedMaxDiscount > HARD_MAX_KIT_DISCOUNT_PERCENT) {
      return NextResponse.json(
        {
          error: `O desconto máximo permitido para kits é de ${HARD_MAX_KIT_DISCOUNT_PERCENT}%.`,
        },
        { status: 400 }
      );
    }

    if (Array.isArray(body.tiers)) {
      const invalidTier = body.tiers.find(
        (t: { discountPercent?: unknown }) =>
          Number(t?.discountPercent ?? 0) > HARD_MAX_KIT_DISCOUNT_PERCENT
      );
      if (invalidTier) {
        return NextResponse.json(
          {
            error: `Nenhuma faixa do kit pode ultrapassar ${HARD_MAX_KIT_DISCOUNT_PERCENT}% de desconto.`,
          },
          { status: 400 }
        );
      }
    }

    const sanitized = sanitizeKitSettings({
      enabled: body.enabled,
      title: body.title,
      subtitle: body.subtitle,
      minItems: body.minItems,
      maxItems: body.maxItems,
      maxDiscountPercent: requestedMaxDiscount,
      tiers: body.tiers,
      allowCouponStacking: body.allowCouponStacking,
    });

    const payload = {
      id: 'default',
      enabled: sanitized.enabled,
      title: sanitized.title,
      subtitle: sanitized.subtitle,
      min_items: sanitized.minItems,
      max_items: sanitized.maxItems,
      max_discount_percent: sanitized.maxDiscountPercent,
      tiers: sanitized.tiers,
      allow_coupon_stacking: sanitized.allowCouponStacking,
    };

    const { data, error } = await auth.db
      .from('kit_settings')
      .upsert(payload, { onConflict: 'id' })
      .select(
        'id, enabled, title, subtitle, min_items, max_items, max_discount_percent, tiers, allow_coupon_stacking, updated_at'
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Erro ao salvar configurações do kit.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: mapKitSettingsRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
}
