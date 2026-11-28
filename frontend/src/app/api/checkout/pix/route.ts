import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  checkRateLimit,
  getClientIp,
  isHoneypotTripped,
  isTrustedSameOrigin,
  rateLimitExceededResponse,
  verifyTurnstileToken,
} from '@/lib/security-guard';
import {
  calculateServerOrderTotals,
  createMercadoPagoTransaction,
  generateOrderNumber,
  getMercadoPagoAccessToken,
  persistServerOrder,
  resolveWebhookNotificationUrl,
} from '@/lib/mercadopago-server';

async function resolveAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Endpoint de Checkout PIX (Mercado Pago + fallback seguro em desenvolvimento).
 * Sempre recalcula o total no servidor, cria o pedido como PENDING e gera QR Code + Copia e Cola.
 */
export async function POST(req: Request) {
  try {
    if (!isTrustedSameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Origem da requisição não autorizada.' },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(req);
    const rate = checkRateLimit({
      scope: 'checkout_pix',
      identifier: clientIp,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rate.allowed) {
      return rateLimitExceededResponse(
        rate.retryAfterSeconds,
        'Muitas solicitações de PIX em poucos minutos. Aguarde alguns instantes.'
      );
    }

    const body = await req.json();

    if (isHoneypotTripped(body)) {
      return NextResponse.json(
        { success: false, error: 'Requisição bloqueada pela proteção anti-robô.' },
        { status: 400 }
      );
    }

    const turnstile = await verifyTurnstileToken(body.captchaToken, clientIp);
    if (!turnstile.ok) {
      return NextResponse.json(
        { success: false, error: turnstile.error || 'Falha na verificação anti-robô.' },
        { status: 400 }
      );
    }

    const orderNumber = String(body.orderNumber || generateOrderNumber());
    const customerName = String(body.customerName || 'Cliente').trim();
    const customerEmail = String(body.customerEmail || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const cleanCpf = String(body.customerCpf || '').replace(/\D/g, '');
    const shippingAddress = body.shippingAddress || {
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
    };
    const shippingMethod = String(body.shippingMethod || 'Expresso');
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'E-mail do cliente é obrigatório para gerar PIX.' },
        { status: 400 }
      );
    }

    const totals = await calculateServerOrderTotals({
      items,
      paymentMethod: 'PIX',
      couponCode: body.couponCode,
    });

    const accessToken = getMercadoPagoAccessToken();
    const nowIso = new Date().toISOString();
    const authenticatedUserId = await resolveAuthenticatedUserId();

    if (accessToken) {
      const notificationUrl = resolveWebhookNotificationUrl(req.url);
      const mpResult = await createMercadoPagoTransaction({
        orderNumber,
        total: totals.total,
        paymentMethod: 'PIX',
        customerName,
        customerEmail,
        cleanCpf,
        notificationUrl,
      });

      if (!mpResult.ok || !mpResult.paymentId) {
        return NextResponse.json(
          {
            success: false,
            error: mpResult.errorMessage || 'Erro ao gerar cobrança PIX no Mercado Pago.',
          },
          { status: mpResult.httpStatus >= 400 ? mpResult.httpStatus : 502 }
        );
      }

      const paymentId = mpResult.paymentId;
      const paymentStatus = mpResult.paymentStatus || 'PENDING';

      await persistServerOrder(
        {
          orderNumber,
          userId: authenticatedUserId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingMethod,
          paymentMethod: 'PIX',
          paymentStatus,
          paymentId,
          pixCode: mpResult.pixCode || undefined,
          pixQrCodeBase64: mpResult.pixQrCodeBase64 || undefined,
          pixTicketUrl: mpResult.ticketUrl || undefined,
          fulfillmentStatus: 'PENDING_SUPPLIER',
          subtotal: totals.subtotal,
          shippingCost: totals.shippingCost,
          discount: totals.discount,
          total: totals.total,
          installments: 1,
          simulated: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        totals.resolvedItems
      );

      return NextResponse.json({
        success: true,
        simulated: false,
        orderNumber,
        paymentId,
        paymentStatus,
        pixCode: mpResult.pixCode || '',
        pixQrCodeBase64: mpResult.pixQrCodeBase64 || undefined,
        ticketUrl: mpResult.ticketUrl || undefined,
        status: mpResult.status || 'action_required',
        total: totals.total,
        subtotal: totals.subtotal,
        discount: totals.discount,
        items: totals.resolvedItems,
      });
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado em produção.' },
        { status: 503 }
      );
    }

    // Modo teste local (sem chaves MP configuradas)
    const simulatedPaymentId = `sim_pix_${Date.now()}`;
    const simulatedPixCode = `00020126580014br.gov.bcb.pix0136evorah-sandbox-${orderNumber}5204000053039865406${totals.total.toFixed(2)}5802BR5916EVORAH EXPERIENCE6009SAO PAULO62070503***6304ABCD`;

    await persistServerOrder(
      {
        orderNumber,
        userId: authenticatedUserId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingMethod,
        paymentMethod: 'PIX',
        paymentStatus: 'PENDING',
        paymentId: simulatedPaymentId,
        pixCode: simulatedPixCode,
        fulfillmentStatus: 'PENDING_SUPPLIER',
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,
        installments: 1,
        simulated: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      totals.resolvedItems
    );

    return NextResponse.json({
      success: true,
      simulated: true,
      orderNumber,
      paymentId: simulatedPaymentId,
      paymentStatus: 'PENDING',
      pixCode: simulatedPixCode,
      status: 'pending',
      total: totals.total,
      subtotal: totals.subtotal,
      discount: totals.discount,
      items: totals.resolvedItems,
    });
  } catch (error) {
    console.error('Erro na rota de PIX:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Falha ao processar PIX.' },
      { status: 500 }
    );
  }
}
