# Plano: Integração Mercado Pago (Checkout Transparente PIX + Cartão + Webhook)

## Arquitetura Decidida
- **Gateway**: Mercado Pago (Checkout Transparente via `@mercadopago/sdk-react` CardPayment Brick + PIX direto `/v1/payments`).
- **Persistência**: Supabase como banco principal (escrita segura no servidor usando `SUPABASE_SERVICE_ROLE_KEY` para ignorar bloqueio RLS no Webhook) + fallback local em desenvolvimento para testes sem chaves.
- **Confirmação em Tempo Real**: Webhook `POST /api/webhooks/mercadopago` valida HMAC (`x-signature`) + consulta `/v1/payments/{id}` -> marca `payment_status = 'PAID'` -> `GET /api/orders/[orderNumber]/status` atualiza Checkout, `/rastreio` e `/admin/pedidos` para **Pago**.

## Etapas
1. Instalar `@mercadopago/sdk-react` em `frontend/` e atualizar `supabase/schema.sql`, `.env.local.example` e `src/types/index.ts`.
2. Criar camada servidora `src/lib/mercadopago-server.ts` e cliente admin `createSupabaseAdminClient` em `src/lib/supabase/server.ts`.
3. Implementar/atualizar endpoints:
   - `POST /api/checkout/pix` (cálculo no servidor, `external_reference`, `notification_url` HTTPS, fallback dev).
   - `POST /api/checkout/card` (tokenização Brick + cobrança `/v1/payments`, fallback dev).
   - `POST /api/webhooks/mercadopago` (HMAC v1 `x-signature` + query/JSON + verificação API MP + simulador seguro apenas em dev).
   - `GET /api/orders/[orderNumber]/status` (leitura Supabase/dev store + fallback sync MP API).
4. Integrar UI mobile-first em `checkout/page.tsx` (`MercadoPagoCardBrick`, polling live PIX -> "Pago", botão de teste Webhook em dev), `admin/pedidos/page.tsx` e `rastreio/page.tsx` (badges Pago/Aguardando).
5. Validar `npx tsc --noEmit` + testes E2E no Chrome CDP (fluxo PIX + simulação Webhook -> "Pago", fluxo Cartão, `/rastreio`, `/admin/pedidos`).
