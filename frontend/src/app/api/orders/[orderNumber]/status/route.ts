import { NextResponse } from 'next/server';
import { getServerOrderStatus } from '@/lib/mercadopago-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
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
    paymentId: order.paymentId,
    paymentMethod: order.paymentMethod,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    updatedAt: order.updatedAt,
  });
}
