import { NextResponse } from 'next/server';
import {
  fetchMercadoPagoTransaction,
  getMercadoPagoAccessToken,
  getMercadoPagoWebhookSecret,
  updateServerOrderPaymentStatus,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago-server';

/**
 * Webhook Oficial do Mercado Pago + Simulador de Desenvolvimento (bloqueado em produção).
 * Aceita notificações de Payments v1 (?topic=payment) e Orders API v1 (type="order" / action="order.*").
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({} as Record<string, any>));

    // Simulador controlado exclusivamente para testes locais sem credenciais MP
    if (body?.action === 'simulate_payment') {
      if (process.env.NODE_ENV === 'production' || Boolean(getMercadoPagoAccessToken())) {
        return NextResponse.json(
          { error: 'Simulação de webhook não permitida neste ambiente.' },
          { status: 403 }
        );
      }

      const targetOrder = body.orderNumber ? String(body.orderNumber) : undefined;
      const targetPaymentId = body.paymentId ? String(body.paymentId) : undefined;
      if (!targetOrder && !targetPaymentId) {
        return NextResponse.json(
          { error: 'Informe orderNumber ou paymentId para simular aprovação.' },
          { status: 400 }
        );
      }

      const updated = await updateServerOrderPaymentStatus({
        orderNumber: targetOrder,
        paymentId: targetPaymentId,
        paymentStatus: 'PAID',
      });

      if (!updated) {
        return NextResponse.json({ error: 'Pedido não encontrado no servidor.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        simulated: true,
        orderNumber: updated.orderNumber,
        paymentStatus: updated.paymentStatus,
        paymentId: updated.paymentId,
      });
    }

    const rawTopic = url.searchParams.get('topic') || url.searchParams.get('type') || body?.type || '';
    const topic = String(rawTopic).toLowerCase();
    const action = String(body?.action || '').toLowerCase();
    const isOrderEvent = topic === 'order' || action.startsWith('order.');
    const isPaymentEvent = topic === 'payment' || action.startsWith('payment.');
    const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    const dataId = queryDataId || (body?.data?.id !== undefined ? String(body.data.id) : null);

    if (!dataId || (!isOrderEvent && !isPaymentEvent)) {
      return NextResponse.json({ received: true });
    }

    // Verifica assinatura HMAC-SHA256 x-signature quando MERCADO_PAGO_WEBHOOK_SECRET estiver configurada
    const webhookSecret = getMercadoPagoWebhookSecret();
    if (webhookSecret) {
      const xSignature = req.headers.get('x-signature');
      const xRequestId = req.headers.get('x-request-id');
      const signatureTargetId = queryDataId || dataId;

      const isValid = verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId: signatureTargetId,
        secret: webhookSecret,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const accessToken = getMercadoPagoAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' },
        { status: 503 }
      );
    }

    // Consulta a Order ou Payment diretamente na API oficial do Mercado Pago para confirmar autenticidade e valor
    const mpTx = await fetchMercadoPagoTransaction(String(dataId), isOrderEvent ? 'order' : 'payment');
    if (!mpTx) {
      return NextResponse.json({ received: true, pendingLookup: true });
    }

    await updateServerOrderPaymentStatus({
      orderNumber: mpTx.orderNumber || undefined,
      paymentId: String(mpTx.id || dataId),
      paymentStatus: mpTx.paymentStatus,
      paidAmount: mpTx.paidAmount > 0 ? mpTx.paidAmount : undefined,
    });

    return NextResponse.json({
      success: true,
      orderNumber: mpTx.orderNumber || null,
      paymentId: String(mpTx.id || dataId),
      paymentStatus: mpTx.paymentStatus,
    });
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
