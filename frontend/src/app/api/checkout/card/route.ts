import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
 * Endpoint de Checkout Transparente com Cartão (Mercado Pago Brick tokenizado).
 * Recebe apenas o token gerado pelo @mercadopago/sdk-react (nunca recebe número/CVV cru).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderNumber = String(body.orderNumber || generateOrderNumber());
    const customerName = String(body.customerName || 'Cliente').trim();
    const customerEmail = String(body.customerEmail || body.payer?.email || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
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
    const installments = Math.max(1, Math.min(12, Math.floor(Number(body.installments) || 1)));

    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'E-mail do pagador é obrigatório.' },
        { status: 400 }
      );
    }

    const totals = await calculateServerOrderTotals({
      items,
      paymentMethod: 'CREDIT_CARD',
      couponCode: body.couponCode,
    });

    const accessToken = getMercadoPagoAccessToken();
    const nowIso = new Date().toISOString();
    const authenticatedUserId = await resolveAuthenticatedUserId();

    if (accessToken) {
      if (!body.token || !body.payment_method_id) {
        return NextResponse.json(
          { success: false, error: 'Token do cartão ausente. Utilize o formulário seguro do Mercado Pago.' },
          { status: 400 }
        );
      }

      const notificationUrl = resolveWebhookNotificationUrl(req.url);
      const cleanCpf = String(body.payer?.identification?.number || body.customerCpf || '').replace(/\D/g, '');

      const mpResult = await createMercadoPagoTransaction({
        orderNumber,
        total: totals.total,
        paymentMethod: 'CREDIT_CARD',
        customerName,
        customerEmail: String(body.payer?.email || customerEmail),
        cleanCpf,
        notificationUrl,
        card: {
          token: String(body.token),
          paymentMethodId: String(body.payment_method_id),
          installments,
          paymentTypeId: body.payment_type_id ? String(body.payment_type_id) : undefined,
          issuerId: body.issuer_id ? String(body.issuer_id) : undefined,
        },
      });

      if (!mpResult.ok || !mpResult.paymentId) {
        return NextResponse.json(
          {
            success: false,
            error: mpResult.errorMessage || 'Não foi possível processar o pagamento com cartão.',
            statusDetail: mpResult.statusDetail,
          },
          { status: mpResult.httpStatus >= 400 ? mpResult.httpStatus : 502 }
        );
      }

      const paymentStatus = mpResult.paymentStatus || 'PENDING';
      const paymentId = mpResult.paymentId;

      if (paymentStatus === 'CANCELLED') {
        return NextResponse.json(
          {
            success: false,
            paymentStatus,
            paymentId,
            status: mpResult.status,
            statusDetail: mpResult.statusDetail,
            error: 'Pagamento recusado pela operadora do cartão. Verifique os dados ou tente outro cartão.',
          },
          { status: 402 }
        );
      }

      await persistServerOrder(
        {
          orderNumber,
          userId: authenticatedUserId,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingMethod,
          paymentMethod: 'CREDIT_CARD',
          paymentStatus,
          paymentId,
          fulfillmentStatus: 'PENDING_SUPPLIER',
          subtotal: totals.subtotal,
          shippingCost: totals.shippingCost,
          discount: totals.discount,
          total: totals.total,
          installments,
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
        status: mpResult.status,
        statusDetail: mpResult.statusDetail,
        installments,
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
    const simulatedOutcome = body.simulatedOutcome === 'pending' ? 'PENDING' : 'PAID';
    const simulatedPaymentId = `sim_card_${Date.now()}`;

    await persistServerOrder(
      {
        orderNumber,
        userId: authenticatedUserId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingMethod,
        paymentMethod: 'CREDIT_CARD',
        paymentStatus: simulatedOutcome,
        paymentId: simulatedPaymentId,
        fulfillmentStatus: 'PENDING_SUPPLIER',
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,
        installments,
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
      paymentStatus: simulatedOutcome,
      status: simulatedOutcome === 'PAID' ? 'approved' : 'in_process',
      installments,
      total: totals.total,
      subtotal: totals.subtotal,
      discount: totals.discount,
      items: totals.resolvedItems,
    });
  } catch (error) {
    console.error('Erro na rota de Cartão:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Falha ao processar cartão.' },
      { status: 500 }
    );
  }
}
