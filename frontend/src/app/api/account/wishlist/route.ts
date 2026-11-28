import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerContext } from '@/lib/customer-api-auth';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET() {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;
  const { data, error } = await db
    .from('customer_wishlists')
    .select('product_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ productIds: [] }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    { productIds: (data || []).map((row) => String(row.product_id)) },
    { headers: NO_STORE_HEADERS }
  );
}

/**
 * Mescla lista local de favoritos com a nuvem no momento do login.
 */
export async function PUT(req: Request) {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;

  try {
    const body = await req.json();
    const incomingIds = Array.isArray(body.productIds)
      ? Array.from(
          new Set(
            body.productIds
              .map((id: unknown) => String(id || '').trim())
              .filter(Boolean)
          )
        ).slice(0, 100)
      : [];

    if (incomingIds.length > 0) {
      // Insere somente produtos válidos existentes no catálogo
      const { data: validProducts } = await db
        .from('products')
        .select('id')
        .in('id', incomingIds);

      const validIds = (validProducts || []).map((p) => String(p.id));
      if (validIds.length > 0) {
        await db.from('customer_wishlists').upsert(
          validIds.map((productId) => ({
            user_id: user.id,
            product_id: productId,
          })),
          { onConflict: 'user_id,product_id', ignoreDuplicates: true }
        );
      }
    }

    const { data: allRows } = await db
      .from('customer_wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json(
      { productIds: (allRows || []).map((row) => String(row.product_id)) },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: 'Erro ao sincronizar favoritos.' }, { status: 400 });
  }
}

/**
 * Alterna (adiciona ou remove) um produto específico nos favoritos do cliente.
 */
export async function POST(req: Request) {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { user, db } = ctx;

  try {
    const body = await req.json();
    const productId = String(body.productId || '').trim();
    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório.' }, { status: 400 });
    }

    const { data: existing } = await db
      .from('customer_wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    let wishlisted = false;
    if (existing) {
      await db
        .from('customer_wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      wishlisted = false;
    } else {
      await db.from('customer_wishlists').insert({
        user_id: user.id,
        product_id: productId,
      });
      wishlisted = true;
    }

    const { data: allRows } = await db
      .from('customer_wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json(
      {
        wishlisted,
        productIds: (allRows || []).map((row) => String(row.product_id)),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar favorito.' }, { status: 400 });
  }
}
