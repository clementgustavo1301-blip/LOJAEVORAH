import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

function maskName(name?: string | null): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Cliente EVORAH';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function maskEmail(email?: string | null): string {
  const raw = String(email || '').trim();
  const atIdx = raw.indexOf('@');
  if (atIdx <= 0) return '***';
  const local = raw.slice(0, atIdx);
  const domain = raw.slice(atIdx + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPhone(phone?: string | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '(**) *****-****';
  return `(**) *****-${digits.slice(-4)}`;
}

function maskCep(cep?: string | null): string {
  const digits = String(cep || '').replace(/\D/g, '');
  if (digits.length !== 8) return '*****-***';
  return `${digits.slice(0, 5)}-***`;
}

function maskStreet(street?: string | null): string {
  const parts = String(street || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Endereço protegido';
  return `${parts[0]} ***`;
}

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().toUpperCase();

  // Bloqueia buscas curtas, buscas por e-mail (@) e caracteres de filtro/wildcard PostgREST
  if (q.length < 5 || q.length > 48 || q.includes('@') || /[%*,()'"\\]/.test(q)) {
    return NextResponse.json({ found: false, order: null }, { headers: NO_STORE_HEADERS });
  }

  const db = createSupabaseAdminClient() || (await createSupabaseServerClient());
  if (!db) {
    return NextResponse.json({ found: false, order: null }, { headers: NO_STORE_HEADERS });
  }

  const safePattern = escapeLikePattern(q);
  const selectColumns =
    'id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_method, payment_method, payment_status, subtotal, shipping_cost, discount, total, installments, created_at, fulfillment_status, tracking_code, tracking_carrier, items:order_items(id, order_id, product_id, product_name, finish, size, unit_price, quantity)';

  const { data: byOrderNumber, error: errByOrder } = await db
    .from('orders')
    .select(selectColumns)
    .ilike('order_number', safePattern)
    .maybeSingle();

  let row = !errByOrder ? byOrderNumber : null;

  if (!row) {
    const { data: byTracking, error: errByTracking } = await db
      .from('orders')
      .select(selectColumns)
      .ilike('tracking_code', safePattern)
      .maybeSingle();

    if (!errByTracking && byTracking) {
      row = byTracking;
    }
  }

  if (!row) {
    return NextResponse.json({ found: false, order: null }, { headers: NO_STORE_HEADERS });
  }

  const rawAddress =
    typeof row.shipping_address === 'string'
      ? (() => {
          try {
            return JSON.parse(row.shipping_address);
          } catch {
            return {};
          }
        })()
      : row.shipping_address || {};

  const sanitizedOrder = {
    id: row.id,
    order_number: row.order_number,
    customer_name: maskName(row.customer_name),
    customer_email: maskEmail(row.customer_email),
    customer_phone: maskPhone(row.customer_phone),
    shipping_address: {
      cep: maskCep(rawAddress.cep),
      street: maskStreet(rawAddress.street),
      number: '***',
      complement: '',
      neighborhood: rawAddress.neighborhood ? 'Região protegida' : '',
      city: String(rawAddress.city || ''),
      state: String(rawAddress.state || ''),
    },
    shipping_method: row.shipping_method,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    subtotal: row.subtotal,
    shipping_cost: row.shipping_cost,
    discount: row.discount,
    total: row.total,
    installments: row.installments,
    created_at: row.created_at,
    fulfillment_status: row.fulfillment_status,
    tracking_code: row.tracking_code,
    tracking_carrier: row.tracking_carrier,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.product_name,
          finish: item.finish,
          size: item.size,
          unit_price: item.unit_price,
          quantity: item.quantity,
        }))
      : [],
  };

  return NextResponse.json(
    { found: true, order: sanitizedOrder },
    { headers: NO_STORE_HEADERS }
  );
}
