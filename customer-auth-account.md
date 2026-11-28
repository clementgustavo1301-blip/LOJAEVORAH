# Customer Authentication & Account Area (`LOJAEVORAH`)

## Goal
Implement full customer authentication (Email/Password + Google OAuth + Password Recovery) and a luxury editorial **"Minha Conta"** area (`/conta`) for **EVORAH Experience**, while strictly separating customer accounts from `/admin` administrators across middleware, API routes, and Supabase RLS.

## Approved Scope
1. **Authentication Methods:** Email + password (login, signup, password recovery) and Google OAuth via Supabase Auth (PKCE flow).
2. **Checkout Integration:** Guest checkout remains open; optional sign-in banner with automatic pre-fill of profile data & saved addresses, plus automatic linking of past guest orders by verified email.
3. **Customer Account Sections (`/conta`):**
   - **Meus Pedidos:** Full order history (logged-in + verified-email linked orders), payment & fulfillment progress, tracking code copy & carrier link.
   - **Meus Dados:** Profile editing (name, phone, CPF) + password update.
   - **Endereços:** Saved shipping addresses CRUD with ViaCEP lookup and default address selection.
   - **Favoritos:** Cloud-synced wishlist merged automatically with localStorage on login.
4. **Admin Security Isolation:** Separate `admin` vs `customer` roles via `public.profiles.role`, `app_metadata.role`, `ADMIN_EMAILS` env var, and strict Supabase RLS (`public.is_admin()`).

## Architecture & File Ownership
- **Database (`database-architect` + `security-auditor`):**
  - `supabase/migrations/20261128_customer_auth.sql` — idempotent migration for `profiles`, `customer_addresses`, `customer_wishlists`, `orders.user_id`, triggers (profile auto-creation, role escalation prevention), and hardened RLS policies.
  - `supabase/schema.sql` — keep canonical full schema updated in sync.
- **Auth & Security Layer (`security-auditor` + `backend-specialist`):**
  - `frontend/src/lib/auth-roles.ts` — shared role evaluation (`isAdminUser`, `getAdminEmails`, `sanitizeRedirectPath`).
  - `frontend/src/lib/admin-api-auth.ts` — enforce admin role check (401 unauthenticated, 403 non-admin).
  - `frontend/src/middleware.ts` — protect `/admin/:path*` (admin-only) and `/conta/:path*` (authenticated).
  - `frontend/src/app/auth/callback/route.ts` — PKCE code exchange for Google OAuth & password recovery.
  - `frontend/src/app/api/auth/me/route.ts` — return current session, profile, and `isAdmin` flag.
  - `frontend/src/app/api/account/profile/route.ts` — GET/PATCH own profile (never alters `role`).
  - `frontend/src/app/api/account/addresses/route.ts` & `[id]/route.ts` — saved addresses CRUD.
  - `frontend/src/app/api/account/orders/route.ts` — list own orders + safely link verified-email guest orders.
  - `frontend/src/app/api/account/wishlist/route.ts` — GET/PUT/POST cloud wishlist sync.
  - `frontend/src/app/api/checkout/pix/route.ts`, `card/route.ts`, `frontend/src/lib/mercadopago-server.ts` — attach optional `user_id` on order creation.
- **Frontend UI & State (`frontend-specialist`):**
  - `frontend/src/types/index.ts` — `CustomerProfile`, `CustomerAddress`, `AuthMeResponse`, `Order.userId`.
  - `frontend/src/context/auth-context.tsx` — client auth provider (`user`, `profile`, `isAdmin`, `loading`, `signOut`, `refreshSession`).
  - `frontend/src/context/cart-context.tsx` — automatic cloud wishlist merge & sync when authenticated.
  - `frontend/src/app/layout.tsx` — wrap app with `AuthProvider`.
  - `frontend/src/app/entrar/page.tsx`, `/cadastro/page.tsx`, `/recuperar-senha/page.tsx`, `/redefinir-senha/page.tsx`.
  - `frontend/src/app/conta/page.tsx` + `frontend/src/components/account/*` (`orders`, `profile`, `addresses`, `wishlist`).
  - `frontend/src/components/layout/header.tsx` & `footer.tsx` — account entry & user menu.
  - `frontend/src/app/checkout/page.tsx` & `checkout-order-confirmation.tsx` — optional login banner, profile/address autofill, save-address checkbox, post-purchase account CTA.
  - `frontend/src/app/admin/login/page.tsx` & `admin/layout.tsx` — verify admin role on login and layout guard.
  - `frontend/.env.local.example` — document `ADMIN_EMAILS`.

## Verification Plan
- `npm run lint` & `npx tsc --noEmit` & `npm run build` in `frontend/`.
- Security scan (`python .agents/skills/vulnerability-scanner/scripts/security_scan.py .`).
- Verify open-redirect protection, role escalation prevention, and guest-order email-verification guard.
