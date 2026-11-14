import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedAdminDb } from '@/lib/admin-api-auth';

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
