# Monte seu Kit EVORAH (`feat/kit-builder`)

## Goal
Build an editorial **"Monte seu Kit"** interactive bundle builder (`/monte-seu-kit`) allowing customers to freely combine 2 to 5 pieces (selecting finish and size for each piece) with progressive discounts capped strictly at **10% max** (never stacking above 10% with coupons or PIX), backed by server-side price recalculation and configurable via `/admin/kits`.

## Approved Rules
- **Format:** Free choice across any categories, 2–5 pieces by default (configurable in `/admin/kits`), selecting finish & size per piece.
- **Discount Cap:** Hard max **10%** (default progressive tiers: 2 pieces = 5% OFF, 3 pieces = 8% OFF, 4+ pieces = 10% OFF).
- **Stacking Policy:** Kit discount does not stack with promotional coupons; combined Kit + PIX discount on kit items is capped at 10% max.
- **Discovery & Management:** Dedicated `/monte-seu-kit` page linked in Header & Footer + `/admin/kits` management screen.

## Architecture
- **Database:** `public.kit_settings` singleton table (`id = 'default'`), CHECK constraint `max_discount_percent <= 10`, RLS (`SELECT` public, write `private.is_admin()`).
- **Pricing Engine:** `frontend/src/lib/kit-pricing.ts` shared by Cart, Checkout, `/monte-seu-kit`, and `mercadopago-server.ts`.
- **APIs:** `/api/kit-settings` (`GET`), `/api/admin/kit-settings` (`GET`/`PUT`), plus server-side validation in `/api/checkout/pix` & `/api/checkout/card`.
- **UI:** `frontend/src/app/monte-seu-kit/page.tsx`, `frontend/src/components/kit/kit-builder-client.tsx`, `frontend/src/app/admin/kits/page.tsx`, plus Cart/MiniCart/Checkout/Header/Footer integration.
