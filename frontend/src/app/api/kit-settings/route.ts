import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_KIT_SETTINGS, mapKitSettingsRow } from '@/lib/kit-pricing';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: DEFAULT_KIT_SETTINGS }, { headers: NO_STORE_HEADERS });
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ settings: DEFAULT_KIT_SETTINGS }, { headers: NO_STORE_HEADERS });
    }

    const { data, error } = await supabase
      .from('kit_settings')
      .select(
        'id, enabled, title, subtitle, min_items, max_items, max_discount_percent, tiers, allow_coupon_stacking, updated_at'
      )
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULT_KIT_SETTINGS }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json(
      { settings: mapKitSettingsRow(data as Record<string, unknown>) },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json({ settings: DEFAULT_KIT_SETTINGS }, { headers: NO_STORE_HEADERS });
  }
}
