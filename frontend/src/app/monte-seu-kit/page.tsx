import type { Metadata } from 'next';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_KIT_SETTINGS, mapKitSettingsRow } from '@/lib/kit-pricing';
import { KitBuilderClient } from '@/components/kit/kit-builder-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monte seu Kit',
  description:
    'Combine correntes, pulseiras, anéis e pingentes em Aço Cirúrgico 316L e Prata 925 no seu estilo com desconto progressivo de até 10% OFF.',
};

async function loadInitialKitSettings() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return DEFAULT_KIT_SETTINGS;

    const { data } = await supabase
      .from('kit_settings')
      .select(
        'id, enabled, title, subtitle, min_items, max_items, max_discount_percent, tiers, allow_coupon_stacking, updated_at'
      )
      .eq('id', 'default')
      .maybeSingle();

    return data ? mapKitSettingsRow(data as Record<string, unknown>) : DEFAULT_KIT_SETTINGS;
  } catch {
    return DEFAULT_KIT_SETTINGS;
  }
}

export default async function MonteSeuKitPage() {
  const [products, categories, settings] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchCategories().catch(() => []),
    loadInitialKitSettings(),
  ]);

  return (
    <KitBuilderClient
      initialProducts={products}
      initialCategories={categories}
      initialSettings={settings}
    />
  );
}
