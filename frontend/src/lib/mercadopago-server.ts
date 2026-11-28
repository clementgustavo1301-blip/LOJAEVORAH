import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { OrderPaymentStatus, ShippingAddress } from '@/types';
import { createSupabaseAdminClient } from './supabase/server';

export interface ServerOrderItemInput {
  productId: string;
  finish?: string;
  size?: string;
  quantity: number;
  fallbackName?: string;
  fallbackPrice?: number;
}

export interface ServerOrderRecord {
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  paymentStatus: OrderPaymentStatus;
  paymentId?: string;
  fulfillmentStatus: 'PENDING_SUPPLIER' | 'ORDERED_SUPPLIER' | 'SHIPPED' | 'DELIVERED';
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  installments: number;
  simulated: boolean;
  createdAt: string;
  updatedAt: string;
}

const TRUSTED_PRODUCT_PRICES: Record<string, { name: string; price: number }> = {};

const DEV_ORDERS_FILE = path.join(os.tmpdir(), 'evorah-dev-orders.json');

declare global {
  var __evorahDevOrders: Map<string, ServerOrderRecord> | undefined;
}

function getDevOrdersMap(): Map<string, ServerOrderRecord> {
  const map = globalThis.__evorahDevOrders ?? new Map<string, ServerOrderRecord>();

  if (process.env.NODE_ENV !== 'production') {
    try {
      if (fs.existsSync(DEV_ORDERS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(DEV_ORDERS_FILE, 'utf8'));
        if (parsed && typeof parsed === 'object') {
          for (const [key, value] of Object.entries(parsed)) {
            map.set(key, value as ServerOrderRecord);
          }
        }
      }
    } catch {
      // Ignore corrupt dev cache
    }
  }

  globalThis.__evorahDevOrders = map;
  return map;
}

function saveDevOrderToDisk(map: Map<string, ServerOrderRecord>) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const recentEntries = Array.from(map.entries()).slice(-100);
    fs.writeFileSync(DEV_ORDERS_FILE, JSON.stringify(Object.fromEntries(recentEntries)), 'utf8');
  } catch {
    // Ignore filesystem errors
  }
}

export function getMercadoPagoAccessToken(): string | null {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token || token.includes('your-') || token.includes('seu-token')) {
    return null;
  }
  return token;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(getMercadoPagoAccessToken());
}

export function getMercadoPagoWebhookSecret(): string | null {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!secret || secret.includes('seu-webhook-secret') || secret.includes('your-')) {
    return null;
  }
  return secret;
}

export function resolveWebhookNotificationUrl(requestUrl: string): string | undefined {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL?.trim() || requestUrl;
  try {
    const parsed = new URL(rawBase);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    ) {
      return undefined;
    }
    return `${parsed.origin}/api/webhooks/mercadopago`;
  } catch {
    return undefined;
  }
}

export function mapMpStatusToOrderPaymentStatus(mpStatus?: string): OrderPaymentStatus {
  const normalized = (mpStatus || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'processed') return 'PAID';
  if (
    [
      'cancelled',
      'canceled',
      'rejected',
      'refunded',
      'charged_back',
      'failed',
      'expired',
    ].includes(normalized)
  ) {
    return 'CANCELLED';
  }
  return 'PENDING';
}

export function generateOrderNumber(): string {
  return `INX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
}

export function isValidBrazilianCpf(rawCpf: string): boolean {
  const digits = rawCpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }
  const calcDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  return calcDigit(9) === Number(digits[9]) && calcDigit(10) === Number(digits[10]);
}

export function formatMercadoPagoApiError(
  status: number,
  mpData: {
    message?: string;
    status_detail?: string;
    cause?: Array<{ description?: string }>;
    errors?: Array<{ code?: string; message?: string }>;
  },
  fallbackMessage: string
): string {
  const firstOrderErr = mpData?.errors?.[0];
  const rawMessage = String(firstOrderErr?.message || mpData?.message || '');
  if (firstOrderErr?.code === 'invalid_transaction_amount') {
    return 'Valor ou parcelamento indisponível para esta bandeira no Mercado Pago. Selecione outro parcelamento (ex: 1x) e tente novamente.';
  }
  if (status === 401 && /unauthorized use of live credentials/i.test(rawMessage)) {
    return 'Credenciais de produção do Mercado Pago ainda não foram ativadas nesta conta/aplicação ("Unauthorized use of live credentials"). Ative a aplicação no painel Mercado Pago Developers ou use suas Credenciais de Teste no .env.local.';
  }
  if (/invalid user identification/i.test(rawMessage)) {
    return 'CPF inválido para emissão da cobrança no Mercado Pago. Confira os 11 dígitos do CPF.';
  }
  return rawMessage || mpData?.cause?.[0]?.description || fallbackMessage;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function calculateServerOrderTotals(params: {
  items: ServerOrderItemInput[];
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  couponCode?: string;
}) {
  const items = Array.isArray(params.items) ? params.items : [];
  if (items.length === 0) {
    throw new Error('Pedido sem itens.');
  }

  const supabase = createSupabaseAdminClient();
  const dbPrices = new Map<string, { name: string; price: number }>();

  if (supabase) {
    const ids = items.map((i) => i.productId).filter(Boolean);
    const { data } = await supabase
      .from('products')
      .select('id, name, price, promotional_price')
      .in('id', ids);

    if (Array.isArray(data)) {
      for (const row of data) {
        const unit = row.promotional_price !== null && row.promotional_price !== undefined
          ? Number(row.promotional_price)
          : Number(row.price);
        dbPrices.set(row.id, { name: row.name, price: unit });
      }
    }
  }

  let subtotal = 0;
  const resolvedItems = items.map((item) => {
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
    const catalogMatch = dbPrices.get(item.productId) || TRUSTED_PRODUCT_PRICES[item.productId];

    let unitPrice = catalogMatch?.price;
    const productName = catalogMatch?.name || item.fallbackName || 'Joia EVORAH';

    if (unitPrice === undefined) {
      if (process.env.NODE_ENV !== 'production' && typeof item.fallbackPrice === 'number' && item.fallbackPrice > 0) {
        unitPrice = item.fallbackPrice;
      } else {
        throw new Error(`Produto não encontrado no catálogo: ${item.productId}`);
      }
    }

    subtotal += unitPrice * quantity;
    return {
      productId: item.productId,
      productName,
      finish: item.finish || 'silver',
      size: item.size || null,
      unitPrice: roundCurrency(unitPrice),
      quantity,
    };
  });

  subtotal = roundCurrency(subtotal);
  const couponUpper = params.couponCode?.trim().toUpperCase();
  const couponDiscount =
    couponUpper === 'BEMVINDO10' ? subtotal * 0.1 : couponUpper === 'INOX15' ? subtotal * 0.15 : 0;
  const afterCoupon = Math.max(0, subtotal - couponDiscount);
  const pixDiscount = params.paymentMethod === 'PIX' ? afterCoupon * 0.05 : 0;
  const discount = roundCurrency(couponDiscount + pixDiscount);
  const shippingCost = 0;
  const total = roundCurrency(Math.max(0.01, afterCoupon - pixDiscount + shippingCost));

  return { subtotal, discount, shippingCost, total, resolvedItems };
}

export async function persistServerOrder(
  record: ServerOrderRecord,
  resolvedItems: Array<{
    productId: string;
    productName: string;
    finish: string;
    size: string | null;
    unitPrice: number;
    quantity: number;
  }>
) {
  if (process.env.NODE_ENV !== 'production' || !createSupabaseAdminClient()) {
    const map = getDevOrdersMap();
    map.set(record.orderNumber, record);
    saveDevOrderToDisk(map);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', record.orderNumber)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('orders')
        .update({
          payment_status: record.paymentStatus,
          payment_id: record.paymentId || null,
          payment_method: record.paymentMethod,
          installments: record.installments,
        })
        .eq('id', existing.id);
      return;
    }

    const baseInsert = {
      order_number: record.orderNumber,
      customer_name: record.customerName,
      customer_email: record.customerEmail,
      customer_phone: record.customerPhone,
      shipping_address: record.shippingAddress,
      shipping_method: record.shippingMethod,
      payment_method: record.paymentMethod,
      payment_status: record.paymentStatus,
      payment_id: record.paymentId || null,
      fulfillment_status: record.fulfillmentStatus,
      subtotal: record.subtotal,
      shipping_cost: record.shippingCost,
      discount: record.discount,
      total: record.total,
      installments: record.installments,
    };

    let inserted: { id: string } | null = null;
    const insertWithUser = await supabase
      .from('orders')
      .insert(record.userId ? { ...baseInsert, user_id: record.userId } : baseInsert)
      .select('id')
      .single();

    if (insertWithUser.data?.id) {
      inserted = insertWithUser.data;
    } else if (record.userId && insertWithUser.error) {
      // Fallback caso o banco ainda não tenha aplicado a coluna user_id
      const fallbackInsert = await supabase
        .from('orders')
        .insert(baseInsert)
        .select('id')
        .single();
      inserted = fallbackInsert.data;
    }

    if (inserted?.id && resolvedItems.length > 0) {
      await supabase.from('order_items').insert(
        resolvedItems.map((it) => ({
          order_id: inserted.id,
          product_id: it.productId || null,
          product_name: it.productName,
          finish: it.finish,
          size: it.size,
          unit_price: it.unitPrice,
          quantity: it.quantity,
        }))
      );
    }
  } catch {
    // Fallback local já preservado em dev quando Supabase está inacessível
  }
}

export async function updateServerOrderPaymentStatus(params: {
  orderNumber?: string;
  paymentId?: string;
  paymentStatus: OrderPaymentStatus;
  paidAmount?: number;
}): Promise<ServerOrderRecord | null> {
  const { orderNumber, paymentId, paymentStatus, paidAmount } = params;
  const nowIso = new Date().toISOString();

  // 1. Atualiza no dev map em não-produção / offline
  const map = getDevOrdersMap();
  let matchedRecord: ServerOrderRecord | null = null;

  if (orderNumber && map.has(orderNumber)) {
    matchedRecord = map.get(orderNumber)!;
  } else if (paymentId) {
    for (const rec of map.values()) {
      if (rec.paymentId === paymentId) {
        matchedRecord = rec;
        break;
      }
    }
  }

  if (matchedRecord) {
    if (
      paidAmount !== undefined &&
      paymentStatus === 'PAID' &&
      paidAmount + 0.05 < matchedRecord.total
    ) {
      throw new Error('Valor pago divergente do total do pedido.');
    }

    const updated: ServerOrderRecord = {
      ...matchedRecord,
      paymentStatus,
      paymentId: paymentId || matchedRecord.paymentId,
      updatedAt: nowIso,
    };
    map.set(updated.orderNumber, updated);
    saveDevOrderToDisk(map);
    matchedRecord = updated;
  }

  // 2. Atualiza no Supabase com Service Role Key
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const query = supabase
      .from('orders')
      .select('id, order_number, total, payment_status, payment_id, payment_method, fulfillment_status, created_at');

    const { data: row } = orderNumber
      ? await query.eq('order_number', orderNumber).maybeSingle()
      : paymentId
      ? await query.eq('payment_id', paymentId).maybeSingle()
      : { data: null };

    if (row) {
      if (paidAmount !== undefined && paymentStatus === 'PAID' && paidAmount + 0.05 < Number(row.total)) {
        throw new Error('Valor pago divergente do total do pedido.');
      }

      await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          payment_id: paymentId || row.payment_id,
          fulfillment_status: row.fulfillment_status || 'PENDING_SUPPLIER',
        })
        .eq('id', row.id);

      return {
        orderNumber: row.order_number,
        customerName: matchedRecord?.customerName || '',
        customerEmail: matchedRecord?.customerEmail || '',
        customerPhone: matchedRecord?.customerPhone || '',
        shippingAddress: matchedRecord?.shippingAddress || {
          cep: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
        },
        shippingMethod: matchedRecord?.shippingMethod || 'Expresso',
        paymentMethod: (row.payment_method as 'PIX' | 'CREDIT_CARD') || 'PIX',
        paymentStatus,
        paymentId: paymentId || row.payment_id || undefined,
        fulfillmentStatus: row.fulfillment_status || 'PENDING_SUPPLIER',
        subtotal: Number(row.total),
        shippingCost: 0,
        discount: 0,
        total: Number(row.total),
        installments: 1,
        simulated: false,
        createdAt: row.created_at || nowIso,
        updatedAt: nowIso,
      };
    }
  }

  return matchedRecord;
}

export interface CreateMercadoPagoTransactionParams {
  orderNumber: string;
  total: number;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  customerName: string;
  customerEmail: string;
  cleanCpf?: string;
  notificationUrl?: string | null;
  card?: {
    token: string;
    paymentMethodId: string;
    installments: number;
    paymentTypeId?: string;
    issuerId?: string;
  };
}

export interface MercadoPagoTransactionResult {
  ok: boolean;
  httpStatus: number;
  errorMessage?: string;
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  paymentStatus?: OrderPaymentStatus;
  pixCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
}

export interface NormalizedMercadoPagoTransaction {
  id: string;
  status: string;
  statusDetail?: string;
  paymentStatus: OrderPaymentStatus;
  orderNumber?: string;
  paidAmount: number;
  pixCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
}

function resolveCompositePaymentStatus(
  orderStatus?: string,
  paymentStatus?: string
): OrderPaymentStatus {
  const mappedOrder = mapMpStatusToOrderPaymentStatus(orderStatus);
  const mappedPayment = mapMpStatusToOrderPaymentStatus(paymentStatus);
  if (mappedOrder === 'CANCELLED' || mappedPayment === 'CANCELLED') return 'CANCELLED';
  if (mappedOrder === 'PAID' || mappedPayment === 'PAID') return 'PAID';
  return 'PENDING';
}

function normalizeMercadoPagoResponse(data: any): NormalizedMercadoPagoTransaction {
  const firstPayment = Array.isArray(data?.transactions?.payments)
    ? data.transactions.payments[0]
    : null;
  const pm = firstPayment?.payment_method || {};
  const poi = firstPayment?.point_of_interaction?.transaction_data || data?.point_of_interaction?.transaction_data || {};
  const rawOrderNumber =
    data?.external_reference ||
    (typeof data?.description === 'string' ? data.description.match(/INX-[0-9A-Z-]+/)?.[0] : undefined);
  const rawAmount = Number(
    data?.total_paid_amount ??
      data?.total_amount ??
      firstPayment?.paid_amount ??
      firstPayment?.amount ??
      data?.transaction_amount ??
      0
  );

  return {
    id: String(data?.id || firstPayment?.id || ''),
    status: String(firstPayment?.status || data?.status || ''),
    statusDetail: firstPayment?.status_detail || data?.status_detail || undefined,
    paymentStatus: firstPayment
      ? resolveCompositePaymentStatus(data?.status, firstPayment?.status)
      : mapMpStatusToOrderPaymentStatus(data?.status),
    orderNumber: rawOrderNumber || undefined,
    paidAmount: Number.isFinite(rawAmount) ? rawAmount : 0,
    pixCode: pm.qr_code || poi.qr_code || undefined,
    pixQrCodeBase64: pm.qr_code_base64 || poi.qr_code_base64 || undefined,
    ticketUrl: pm.ticket_url || poi.ticket_url || undefined,
  };
}

/**
 * Cria cobrança PIX ou Cartão na API v1/orders (padrão atual do Mercado Pago),
 * com fallback automático para v1/payments apenas em caso de 403/404.
 */
export async function createMercadoPagoTransaction(
  params: CreateMercadoPagoTransactionParams
): Promise<MercadoPagoTransactionResult> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      httpStatus: 500,
      errorMessage: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.',
    };
  }

  const nameParts = (params.customerName || 'Cliente').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Cliente';
  const lastName = nameParts.slice(1).join(' ') || 'EVORAH';
  const validCpf = params.cleanCpf && isValidBrazilianCpf(params.cleanCpf) ? params.cleanCpf : null;
  const amountStr = Number(params.total).toFixed(2);
  const isPix = params.paymentMethod === 'PIX';

  const orderPaymentMethod: Record<string, any> = isPix
    ? { id: 'pix', type: 'bank_transfer' }
    : {
        id: params.card?.paymentMethodId,
        type: params.card?.paymentTypeId === 'debit_card' ? 'debit_card' : 'credit_card',
        token: params.card?.token,
        installments: Math.max(1, Math.min(12, Math.floor(Number(params.card?.installments) || 1))),
      };

  const ordersPayload: Record<string, any> = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: amountStr,
    external_reference: params.orderNumber,
    payer: {
      email: params.customerEmail,
      first_name: firstName,
      last_name: lastName,
      ...(validCpf ? { identification: { type: 'CPF', number: validCpf } } : {}),
    },
    transactions: {
      payments: [
        {
          amount: amountStr,
          payment_method: orderPaymentMethod,
        },
      ],
    },
  };

  const ordersRes = await fetch('https://api.mercadopago.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': params.orderNumber,
    },
    body: JSON.stringify(ordersPayload),
    signal: AbortSignal.timeout(9000),
  });

  const ordersData = await ordersRes.json();
  if (ordersRes.ok) {
    const normalized = normalizeMercadoPagoResponse(ordersData);
    return {
      ok: true,
      httpStatus: ordersRes.status,
      paymentId: normalized.id,
      status: normalized.status,
      statusDetail: normalized.statusDetail,
      paymentStatus: isPix && normalized.paymentStatus === 'PENDING' ? 'PENDING' : normalized.paymentStatus,
      pixCode: normalized.pixCode,
      pixQrCodeBase64: normalized.pixQrCodeBase64,
      ticketUrl: normalized.ticketUrl,
    };
  }

  // Fallback para /v1/payments apenas se a conta não tiver /v1/orders habilitada (403/404)
  if (ordersRes.status !== 403 && ordersRes.status !== 404) {
    return {
      ok: false,
      httpStatus: ordersRes.status >= 400 ? ordersRes.status : 502,
      errorMessage: formatMercadoPagoApiError(
        ordersRes.status,
        ordersData,
        isPix
          ? 'Erro ao gerar cobrança PIX no Mercado Pago.'
          : 'Erro ao processar pagamento no Mercado Pago.'
      ),
    };
  }

  const legacyPayload: Record<string, any> = isPix
    ? {
        transaction_amount: params.total,
        description: `Pedido ${params.orderNumber} - EVORAH Experience`,
        payment_method_id: 'pix',
        external_reference: params.orderNumber,
        payer: {
          email: params.customerEmail,
          first_name: firstName,
          last_name: lastName,
          ...(validCpf ? { identification: { type: 'CPF', number: validCpf } } : {}),
        },
        ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
      }
    : {
        transaction_amount: params.total,
        token: params.card?.token,
        description: `Pedido ${params.orderNumber} - EVORAH Experience`,
        installments: Math.max(1, Math.min(12, Math.floor(Number(params.card?.installments) || 1))),
        payment_method_id: params.card?.paymentMethodId,
        ...(params.card?.issuerId ? { issuer_id: params.card.issuerId } : {}),
        external_reference: params.orderNumber,
        payer: {
          email: params.customerEmail,
          first_name: firstName,
          last_name: lastName,
          ...(validCpf ? { identification: { type: 'CPF', number: validCpf } } : {}),
        },
        ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
      };

  const legacyRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${params.orderNumber}-legacy`,
    },
    body: JSON.stringify(legacyPayload),
    signal: AbortSignal.timeout(8000),
  });

  const legacyData = await legacyRes.json();
  if (!legacyRes.ok) {
    return {
      ok: false,
      httpStatus: legacyRes.status >= 400 ? legacyRes.status : 502,
      errorMessage: formatMercadoPagoApiError(
        legacyRes.status,
        legacyData,
        isPix
          ? 'Erro ao gerar cobrança PIX no Mercado Pago.'
          : 'Erro ao processar pagamento no Mercado Pago.'
      ),
    };
  }

  const normalizedLegacy = normalizeMercadoPagoResponse(legacyData);
  return {
    ok: true,
    httpStatus: legacyRes.status,
    paymentId: normalizedLegacy.id,
    status: normalizedLegacy.status,
    statusDetail: normalizedLegacy.statusDetail,
    paymentStatus: normalizedLegacy.paymentStatus,
    pixCode: normalizedLegacy.pixCode,
    pixQrCodeBase64: normalizedLegacy.pixQrCodeBase64,
    ticketUrl: normalizedLegacy.ticketUrl,
  };
}

export async function fetchMercadoPagoOrderById(orderId: string): Promise<any | null> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken || !orderId) return null;

  const res = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(4500),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMercadoPagoPaymentById(paymentId: string): Promise<any | null> {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken || !paymentId) return null;

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(4500),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchMercadoPagoTransaction(
  id: string,
  topicHint?: string | null
): Promise<NormalizedMercadoPagoTransaction | null> {
  if (!id) return null;
  const preferOrder = /^ord/i.test(id) || topicHint === 'order';
  const primary = preferOrder
    ? await fetchMercadoPagoOrderById(id)
    : await fetchMercadoPagoPaymentById(id);
  if (primary) return normalizeMercadoPagoResponse(primary);

  const secondary = preferOrder
    ? await fetchMercadoPagoPaymentById(id)
    : await fetchMercadoPagoOrderById(id);
  return secondary ? normalizeMercadoPagoResponse(secondary) : null;
}

export async function getServerOrderStatus(orderNumber: string): Promise<ServerOrderRecord | null> {
  const map = getDevOrdersMap();
  const localRec = map.get(orderNumber) || null;

  const supabase = createSupabaseAdminClient();
  let dbRec: ServerOrderRecord | null = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('orders')
        .select('order_number, customer_name, customer_email, customer_phone, payment_method, payment_status, payment_id, fulfillment_status, subtotal, shipping_cost, discount, total, installments, created_at')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (data) {
        dbRec = {
          orderNumber: data.order_number,
          customerName: data.customer_name || '',
          customerEmail: data.customer_email || '',
          customerPhone: data.customer_phone || '',
          shippingAddress: localRec?.shippingAddress || {
            cep: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
          },
          shippingMethod: 'Expresso',
          paymentMethod: (data.payment_method as 'PIX' | 'CREDIT_CARD') || 'PIX',
          paymentStatus: (data.payment_status as OrderPaymentStatus) || 'PENDING',
          paymentId: data.payment_id || undefined,
          fulfillmentStatus: data.fulfillment_status || 'PENDING_SUPPLIER',
          subtotal: Number(data.subtotal || data.total || 0),
          shippingCost: Number(data.shipping_cost || 0),
          discount: Number(data.discount || 0),
          total: Number(data.total || 0),
          installments: Number(data.installments || 1),
          simulated: false,
          createdAt: data.created_at,
          updatedAt: data.created_at,
        };
      }
    } catch {
      // Fall back to local dev store
    }
  }

  const current = dbRec || localRec;
  if (!current) return null;

  // Se o pedido ainda está PENDING e tem paymentId real do MP, reconcilia direto na API MP
  if (
    current.paymentStatus === 'PENDING' &&
    current.paymentId &&
    !current.paymentId.startsWith('sim_') &&
    isMercadoPagoConfigured()
  ) {
    try {
      const mpTx = await fetchMercadoPagoTransaction(current.paymentId);
      if (mpTx && mpTx.paymentStatus !== current.paymentStatus) {
        const synced = await updateServerOrderPaymentStatus({
          orderNumber: current.orderNumber,
          paymentId: String(mpTx.id || current.paymentId),
          paymentStatus: mpTx.paymentStatus,
          paidAmount: mpTx.paidAmount > 0 ? mpTx.paidAmount : undefined,
        });
        if (synced) return synced;
      }
    } catch {
      // Mantém estado atual caso a consulta externa falhe temporariamente
    }
  }

  return current;
}

export function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !xRequestId || !dataId || !secret) return false;

  let ts = '';
  let hashV1 = '';
  for (const part of xSignature.split(',')) {
    const [key, ...rest] = part.split('=');
    const val = rest.join('=').trim();
    if (key.trim() === 'ts') ts = val;
    if (key.trim() === 'v1') hashV1 = val;
  }

  if (!ts || !hashV1 || !/^[a-f0-9]+$/i.test(hashV1)) return false;

  const normalizedId = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${normalizedId};request-id:${xRequestId};ts:${ts};`;
  const expectedHex = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const expectedBuf = Buffer.from(expectedHex, 'hex');
  const receivedBuf = Buffer.from(hashV1.toLowerCase(), 'hex');
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
