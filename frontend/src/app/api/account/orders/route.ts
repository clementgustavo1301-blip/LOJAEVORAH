import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerContext } from '@/lib/customer-api-auth';
import { isEmailVerifiedUser } from '@/lib/auth-roles';
import type { Order, OrderItem, ShippingAddress } from '@/types';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

const ORDER_SELECT =
  'id, user_id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_method, payment_method, payment_status, payment_id, fulfillment_status, tracking_code, tracking_carrier, subtotal, shipping_cost, discount, total, installments, created_at, items:order_items(id, order_id, product_id, product_name, finish, size, unit_price, quantity)';

function parseShippingAddress(raw: unknown): ShippingAddress {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parseShippingAddress(parsed);
    } catch {
      return { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' };
    }
  }
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    cep: String(obj.cep || ''),
    street: String(obj.street || ''),
    number: String(obj.number || ''),
    complement: obj.complement ? String(obj.complement) : '',
    neighborhood: String(obj.neighborhood || ''),
    city: String(obj.city || ''),
    state: String(obj.state || ''),
  };
}

function mapCustomerOrder(row: Record<string, unknown>): Order {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items: OrderItem[] = rawItems.map((item) => {
    const it = item as Record<string, unknown>;
    return {
      id: it.id ? String(it.id) : undefined,
      orderId: it.order_id ? String(it.order_id) : undefined,
      productId: String(it.product_id || ''),
      productName: String(it.product_name || 'Joia EVORAH'),
      finish: String(it.finish || 'silver'),
      size: it.size ? String(it.size) : null,
      unitPrice: Number(it.unit_price || 0),
      quantity: Number(it.quantity || 1),
    };
  });

  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name || ''),
    customerEmail: String(row.customer_email || ''),
    customerPhone: String(row.customer_phone || ''),
    shippingAddress: parseShippingAddress(row.shipping_address),
    shippingMethod: String(row.shipping_method || 'Expresso'),
    paymentMethod: (row.payment_method === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX'),
    paymentStatus: (row.payment_status as Order['paymentStatus']) || 'PENDING',
    paymentId: row.payment_id ? String(row.payment_id) : undefined,
    fulfillmentStatus: (row.fulfillment_status as Order['fulfillmentStatus']) || 'PENDING_SUPPLIER',
    trackingCode: row.tracking_code ? String(row.tracking_code) : undefined,
    trackingCarrier: row.tracking_carrier ? String(row.tracking_carrier) : undefined,
    subtotal: Number(row.subtotal || 0),
    shippingCost: Number(row.shipping_cost || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total || 0),
    installments: Number(row.installments || 1),
    createdAt: String(row.created_at || new Date().toISOString()),
    items,
  };
}

export async function GET() {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db, adminDb } = ctx;
  const email = (user.email || '').trim().toLowerCase();
  const emailVerified = isEmailVerifiedUser(user);

  // Vincula automaticamente compras antigas feitas como visitante quando o e-mail já foi verificado
  // Usa adminDb apenas para essa atualização controlada; a leitura abaixo passa pelo RLS do usuário (`db`)
  if (email && emailVerified && adminDb) {
    try {
      await adminDb
        .from('orders')
        .update({ user_id: user.id })
        .is('user_id', null)
        .ilike('customer_email', email);
    } catch {
      // Ignora erro caso a coluna user_id ainda não tenha sido aplicada
    }
  }

  const byUserIdRes = await db
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const mergedMap = new Map<string, Order>();

  if (!byUserIdRes.error && Array.isArray(byUserIdRes.data)) {
    for (const row of byUserIdRes.data) {
      const mapped = mapCustomerOrder(row as Record<string, unknown>);
      mergedMap.set(mapped.orderNumber, mapped);
    }
  }

  // Fallback seguro por e-mail verificado (cobre pedidos ainda sem user_id ou bancos antes da migration)
  if (email && emailVerified) {
    const byEmailRes = await db
      .from('orders')
      .select(ORDER_SELECT)
      .ilike('customer_email', email)
      .order('created_at', { ascending: false });

    if (!byEmailRes.error && Array.isArray(byEmailRes.data)) {
      for (const row of byEmailRes.data) {
        const mapped = mapCustomerOrder(row as Record<string, unknown>);
        if (!mapped.userId || mapped.userId === user.id) {
          mergedMap.set(mapped.orderNumber, mapped);
        }
      }
    }
  }

  const orders = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(
    {
      orders,
      emailVerified,
    },
    { headers: NO_STORE_HEADERS }
  );
}
