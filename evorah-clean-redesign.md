# EVORAH Experience — Clean Frontend Redesign Plan

## Goal
Transform the storefront from a cluttered promotional template (`BRAND NAME`) into a refined, gallery-clean luxury jewelry experience for **EVORAH EXPERIENCE**, integrating the official gold logo and black-background motion video in the Hero and applying a clean light editorial aesthetic across all pages.

## Key Changes
1. **Brand Assets & Tokens (`tailwind.config.ts`, `globals.css`, `layout.tsx`, `logo.tsx`)**:
   - Replace all `"BRAND NAME"` placeholders with **EVORAH EXPERIENCE**.
   - Build a crisp SVG + image [`Logo`](file:///c:/Users/Lenovo/Desktop/loja/frontend/src/components/ui/logo.tsx) component matching the exact `EVORAH — EXPERIENCE —` geometry (`E V O R Λ H`) in gold/obsidian/white variants.
   - Refine color palette in [`tailwind.config.ts`](file:///c:/Users/Lenovo/Desktop/loja/frontend/tailwind.config.ts): `#FFFFFF` surface, `#FAF9F6` warm alabaster background, `#EAE8E3` hairline borders, `#0A0A0A` obsidian text, and `#C9A452` EVORAH gold accent.
2. **Header, TopBar & Footer (`top-bar.tsx`, `header.tsx`, `footer.tsx`)**:
   - Minimalist obsidian/gold announcement bar.
   - Airy `h-20` sticky [`Header`](file:///c:/Users/Lenovo/Desktop/loja/frontend/src/components/layout/header.tsx) with EVORAH logo, refined uppercase tracking links, clean search overlay, and minimal bag indicator.
   - Editorial [`Footer`](file:///c:/Users/Lenovo/Desktop/loja/frontend/src/components/layout/footer.tsx) with EVORAH identity, clean newsletter input, and uncluttered navigation columns.
3. **Hero with EVORAH Video + Clean Home (`page.tsx`)**:
   - Obsidian (`#0A0A0A`) Hero section featuring the official `/brand/evorah-intro.mp4` motion video alongside minimalist editorial typography and gold/white CTAs.
   - Clean 3-pillar architectural strip (À Prova D'Água, Aço 316L & Prata 925, Garantia Vitalícia).
   - Editorial category grid with 4:5 portrait ratios and subtle hover zoom.
   - Spacious Best Sellers & New Arrivals sections (`py-16 lg:py-24`) with clean section headers.
4. **Jewelry-Grade Minimalist `ProductCard` (`product-card.tsx`)**:
   - Remove `"COMPRE 2 LEVE 3"` pill, remove yellow stars row, remove `#08585E` teal text and `#133E35` green badge.
   - Use a 4:5 portrait gallery frame (`aspect-[4/5]`), at most 1 subtle badge (`-XX%` or `Novo`), slide-up translucent quick-add button on hover, clean title, muted material caption, and clear price + installment typography.
5. **Internal Storefront Pages (`/produtos`, `/produto/[slug]`, `mini-cart-drawer.tsx`, `/favoritos`, `/rastreio`, `/carrinho`, `/checkout`, `/admin/login`)**:
   - Unify spacing, sharp geometry, hairline borders (`border-brand-border`), and EVORAH branding across every route.

## Verification Criteria
- `npm run lint` and `npx tsc --noEmit` in `frontend/` pass with zero errors.
- `npm run build` in `frontend/` succeeds cleanly.
- UX and Accessibility audit scripts executed and summarized.
