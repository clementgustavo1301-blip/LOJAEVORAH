---
version: alpha
name: EVORAH Experience — Utilitarian Luxury Minimal
description: High-contrast obsidian hero with gold EVORAH motion identity transitioning into an airy, gallery-grade light editorial jewelry storefront.
colors:
  primary: "#0A0A0A"
  secondary: "#C9A452"
  tertiary: "#A88434"
  neutral: "#FAF9F6"
  surface: "#FFFFFF"
  elevated: "#F4F3EF"
  border: "#EAE8E3"
  on-surface: "#0A0A0A"
  muted: "#6E6D6A"
  error: "#9F2F2D"
typography:
  headline-display:
    fontFamily: Cormorant Garamond
    fontSize: 52px
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Cormorant Garamond
    fontSize: 34px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Cormorant Garamond
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.14em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.18em
rounded:
  none: 0px
  xs: 2px
  sm: 2px
  md: 4px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: 16px
  button-gold:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: 16px
  product-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    padding: 0px
---

# EVORAH Experience

## Overview
EVORAH Experience is a contemporary jewelry house crafting waterproof 925 Sterling Silver and 316L Surgical Steel pieces. The visual architecture pairs a cinematic obsidian (`#0A0A0A`) Hero featuring the official EVORAH gold motion reveal (`/brand/evorah-intro.mp4`) with an ultra-clean, gallery-grade light editorial storefront (`#FFFFFF` / `#FAF9F6`).

## Colors
- **Primary (`#0A0A0A`):** Deep obsidian used for the Hero stage, primary typography, and primary CTAs.
- **Secondary (`#C9A452`):** EVORAH signature brushed gold extracted directly from the brand mark (`EVORAH — EXPERIENCE —`). Used exclusively as a restrained luxury accent.
- **Surface (`#FFFFFF`) & Neutral (`#FAF9F6`):** Gallery white and warm alabaster canvas for maximum breathing room around jewelry photography.
- **Border (`#EAE8E3`):** 1px hairline architectural dividers (`#EAE8E3`) replacing heavy shadows or thick boxes.
- **Muted (`#6E6D6A`):** Warm stone gray for secondary metadata and installment details.

## Typography
- **Display & Section Headings (`Cormorant Garamond`):** Editorial serif with tight tracking (`-0.02em`) and light-to-medium weight (`400–500`) for timeless jewelry authority.
- **UI, Navigation & Pricing (`Manrope`):** Clean geometric sans-serif with `tabular-nums` enforced on all prices, installments, and counters.

## Layout
- Macro-whitespace (`py-16` to `py-24`) between sections.
- Container constrained to `max-w-[1240px]` with generous horizontal padding (`px-6 sm:px-10 lg:px-12`).
- Hairline `1px solid #EAE8E3` structural borders instead of heavy card shadows.

## Elevation & Depth
- Flat gallery architecture in the catalog; subtle diffused elevation (`0 12px 32px rgba(10,10,10,0.05)`) only on floating drawers and modals.

## Shapes
- Sharp, crisp jewelry geometry (`rounded-none` / `0px` to `2px`) across buttons, inputs, product cards, and galleries.

## Components
- **ProductCard:** Gallery-clean 4:5 portrait frame (`aspect-[4/5]`), zero promotional clutter (no `COMPRE 2 LEVE 3` banners, no bright yellow star rows, no teal `#08585E` text). At most one subtle top-left badge (`-XX%` or `NOVO`), whisper-quiet quick-add bar on hover, clean left-aligned title, material subtitle in muted stone, and tabular price + installment line.
- **Header:** Sticky white architectural bar (`h-20`), centered navigation with subtle underline hover, EVORAH gold/obsidian brand mark, and clean icon actions.

## Do's and Don'ts
- **Do** keep at least 35% of the viewport as open whitespace in the light catalog sections.
- **Don't** use loud promotional pills (`COMPRE 2 LEVE 3`), bright teal (`#08585E`), dark green (`#133E35`), or yellow star clutter on product cards.
- **Don't** mix rounded-lg cards with sharp buttons; lock the entire storefront to crisp `0px–2px` geometry.
