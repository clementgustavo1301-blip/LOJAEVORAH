-- ============================================================================
-- MIGRATION: STORE PIX QR CODE & COPIA E COLA ON PENDING ORDERS
-- Allows customers to resume and pay pending PIX orders directly in /conta.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pix_code TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT,
  ADD COLUMN IF NOT EXISTS pix_ticket_url TEXT;
