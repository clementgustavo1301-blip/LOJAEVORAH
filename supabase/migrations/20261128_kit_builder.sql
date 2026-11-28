-- ============================================================================
-- MIGRATION: KIT BUILDER SETTINGS (MONTE SEU KIT EVORAH)
-- Enforces hard 10% max discount cap at database constraint level.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kit_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  title TEXT NOT NULL DEFAULT 'Monte seu Kit EVORAH',
  subtitle TEXT NOT NULL DEFAULT 'Combine correntes, pulseiras, anéis e pingentes no mesmo estilo e desbloqueie até 10% OFF.',
  min_items INTEGER NOT NULL DEFAULT 2 CHECK (min_items >= 2 AND min_items <= 5),
  max_items INTEGER NOT NULL DEFAULT 5 CHECK (max_items >= 2 AND max_items <= 10),
  max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (max_discount_percent >= 0 AND max_discount_percent <= 10),
  tiers JSONB NOT NULL DEFAULT '[{"minItems":2,"discountPercent":5},{"minItems":3,"discountPercent":8},{"minItems":4,"discountPercent":10}]'::jsonb,
  allow_coupon_stacking BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT kit_settings_min_lte_max CHECK (min_items <= max_items)
);

GRANT SELECT ON public.kit_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.kit_settings TO authenticated;

CREATE TRIGGER trg_kit_settings_updated_at
  BEFORE UPDATE ON public.kit_settings
  FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

ALTER TABLE public.kit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de regras de kit" ON public.kit_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin inserção de regras de kit" ON public.kit_settings
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin atualização de regras de kit" ON public.kit_settings
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "Admin exclusão de regras de kit" ON public.kit_settings
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

INSERT INTO public.kit_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
