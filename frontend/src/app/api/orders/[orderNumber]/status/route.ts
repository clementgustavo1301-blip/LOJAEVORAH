import { NextResponse } from 'next/server';
import { getServerOrderStatus } from '@/lib/mercadopago-server';
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from '@/lib/security-guard';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const rate = checkRateLimit({
    scope: 'order_status',
    identifier: getClientIp(req),
    limit: 60,
    windowMs: 5 * 60 * 1000,
  });
  if (!rate.allowed) {
    return rateLimitExceededResponse(rate.retryAfterSeconds);
  }

  const { orderNumber } = await context.params;
  const cleanNumber = decodeURIComponent(orderNumber || '').trim();

  if (!cleanNumber) {
    return NextResponse.json({ found: false, error: 'Número de pedido inválido.' }, { status: 400 });
  }

  const order = await getServerOrderStatus(cleanNumber);
  if (!order) {
    return NextResponse.json({ found: false, orderNumber: cleanNumber });
  }

  return NextResponse.json({
    found: true,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    updatedAt: order.updatedAt,
  });
}
