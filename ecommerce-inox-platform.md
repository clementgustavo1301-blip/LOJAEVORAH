# Task Plan: Premium Inox E-Commerce (Next.js + NestJS + TanStack)

## Objective
Build a high-security, high-performance e-commerce platform for luxury stainless steel jewelry adhering to the `DESIGN.md` specification and brand book.

## Architecture & Security Stack
- **Frontend (`frontend`)**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS with `DESIGN.md` tokens, `@tanstack/react-query` v5.
- **Backend (`backend`)**: NestJS, TypeScript, Prisma ORM, SQLite/PostgreSQL-ready, Helmet, Throttler rate limiting, Class-Validator, JWT Auth.
- **Shared Contracts**: Consistent REST API for Products, Categories, Cart, Orders, and Auth.

## Action Tasks
1. [x] Create project plan (`ecommerce-inox-platform.md`) & design specification (`DESIGN.md`).
2. [x] Scaffold and configure NestJS secure backend (`backend`) with Prisma, products/cart/orders modules, CORS, Helmet, and validation pipes.
3. [x] Seed luxury stainless steel jewelry catalog (Anéis, Correntes, Cordões, Pingentes, Pulseiras, Brincos) with 4 finishes (Aço Polido, Dourado, Black PVD, Bicolor).
4. [x] Scaffold and configure Next.js 15 frontend (`frontend`) with Tailwind CSS configured to `DESIGN.md` tokens, TanStack Query provider, and responsive layout.
5. [x] Implement Core UI Components & Kit (Buttons, Inputs, Badges, Swatches, Rating, Quantity selector, Accordion, Modal, Drawer).
6. [x] Implement Navigation & Mega-menu, Header, Footer, and responsive mobile bar.
7. [x] Implement Catalog & Filter systems (Category, Finish, Price, Gender, Best Sellers, New Arrivals).
8. [x] Implement Interactive Mini-Cart Drawer & Full Cart calculation with coupon and shipping logic.
9. [x] Implement 4-step Checkout flow (Identificação, Entrega, Pagamento PIX/Cartão, Confirmação de Pedido).
10. [x] Implement Product Detail Page (PDP) with high-detail gallery, finish swatches, size selector, warranty and care guides.
11. [x] Implement Live Interactive Design System Page (`/design-system`) showcasing all components, states, tokens, and branding.
12. [x] End-to-end verification, test builds, and launch preview server.
13. [x] Implement Quick Link Importer (Shopee & TikTok Shop) in `/admin/produtos` with auto-metadata extraction (`/api/suppliers/extract`), real-time profit calculator, and photo gallery editor.
14. [x] Implement 1-Click Fulfillment in `/admin/pedidos` ("Copiar Endereço" + "Abrir na Shopee / TikTok Shop") with SPX, J&T Express, and Correios tracking integration and real profit calculation.
