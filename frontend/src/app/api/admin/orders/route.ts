import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedAdminDb } from '@/lib/admin-api-auth';

const VALID_FULFILLMENT_STATUSES = new Set([
  'PENDING_SUPPLIER',
  'ORDERED_SUPPLIER',
  'SHIPPED',
  'DELIVERED',
]);

export async function GET() {
  try {
    const { db, error: authError } = await getAuthorizedAdminDb();
    if (authError || !db) return authError!;

    const { data, error } = await db
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { orders: data || [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao listar pedidos.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { db, error: authError } = await getAuthorizedAdminDb();
    if (authError || !db) return authError!;

    const body = await req.json().catch(() => null);
    const id = String(body?.id || '').trim();
    const fulfillmentStatus = String(body?.fulfillmentStatus || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 });
    }
    if (!VALID_FULFILLMENT_STATUSES.has(fulfillmentStatus)) {
      return NextResponse.json({ error: 'Status de envio inválido.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      fulfillment_status: fulfillmentStatus,
      tracking_carrier:
        typeof body?.trackingCarrier === 'string' && body.trackingCarrier.trim()
          ? body.trackingCarrier.trim()
          : 'Shopee Xpress (SPX)',
    };

    if (body?.supplierOrderId !== undefined) {
      updatePayload.supplier_order_id = body.supplierOrderId || null;
    }
    if (body?.supplierName !== undefined) {
      updatePayload.supplier_name = body.supplierName || null;
    }
    if (body?.trackingCode !== undefined) {
      updatePayload.tracking_code = body.trackingCode || null;
    }
    if (body?.supplierUrl !== undefined) {
      updatePayload.supplier_url = body.supplierUrl || null;
    }

    const { data, error } = await db
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, items:order_items(*)')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ updated: true, order: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar pedido.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { db, error: authError } = await getAuthorizedAdminDb();
    if (authError || !db) return authError!;

    const queryId = req.nextUrl.searchParams.get('id');
    const body = queryId ? null : await req.json().catch(() => null);
    const id = (queryId || body?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await db
      .from('orders')
      .delete()
      .eq('id', id)
      .select('id, order_number')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Pedido não encontrado para exclusão.' }, { status: 404 });
    }

    return NextResponse.json({
      deleted: true,
      id: data.id,
      orderNumber: data.order_number,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao excluir pedido.' },
      { status: 500 }
    );
  }
}
