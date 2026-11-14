import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthorizedAdminDb } from '@/lib/admin-api-auth';
import { invalidateProductsCache, mapProduct } from '@/lib/api';

function revalidateCatalog(slug?: string | null) {
  invalidateProductsCache();
  revalidateTag('products');
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/produtos');
  revalidatePath('/produto/[slug]', 'page');
  if (slug) {
    revalidatePath(`/produto/${slug}`);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { db, error: authError } = await getAuthorizedAdminDb();
    if (authError || !db) return authError!;

    const body = await req.json();
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim()) updatePayload.name = body.name.trim();
    if (typeof body.description === 'string') updatePayload.description = body.description.trim();
    if (typeof body.supplierName === 'string') updatePayload.supplier_name = body.supplierName.trim();
    if (typeof body.supplierUrl === 'string') updatePayload.supplier_url = body.supplierUrl.trim();
    if (typeof body.supplierCost === 'number' && Number.isFinite(body.supplierCost)) {
      updatePayload.supplier_cost = body.supplierCost;
    }
    if (typeof body.estimatedDeliveryDays === 'string') {
      updatePayload.estimated_delivery_days = body.estimatedDeliveryDays.trim();
    }
    if (typeof body.price === 'number' && Number.isFinite(body.price) && body.price > 0) {
      updatePayload.price = body.price;
    }
    if (body.promotionalPrice === null) {
      updatePayload.promotional_price = null;
    } else if (
      typeof body.promotionalPrice === 'number' &&
      Number.isFinite(body.promotionalPrice) &&
      body.promotionalPrice > 0
    ) {
      updatePayload.promotional_price = body.promotionalPrice;
    }
    if (Array.isArray(body.images)) {
      updatePayload.images = body.images.filter(
        (img: unknown): img is string => typeof img === 'string' && img.trim().length > 0
      );
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido enviado.' }, { status: 400 });
    }

    const { data, error } = await db
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select('*, category:categories(*)')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Produto não encontrado no banco de dados para atualização.' },
        { status: 404 }
      );
    }

    const mapped = mapProduct(data);
    revalidateCatalog(mapped.slug);

    return NextResponse.json({ product: mapped });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao atualizar produto.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, error: authError } = await getAuthorizedAdminDb();
    if (authError || !db) return authError!;

    const body = await req.json();
    if (!body?.id || !body?.name || !body?.slug || typeof body?.price !== 'number') {
      return NextResponse.json({ error: 'Dados obrigatórios do produto ausentes.' }, { status: 400 });
    }

    const { data, error } = await db
      .from('products')
      .insert({
        id: body.id,
        name: body.name,
        slug: body.slug,
        description: body.description || '',
        specifications: body.specifications || '',
        care_instructions: body.careInstructions || '',
        material: body.material || 'Aço Cirúrgico 316L',
        price: body.price,
        promotional_price: body.promotionalPrice ?? null,
        rating: body.rating ?? 5.0,
        reviews_count: body.reviewsCount ?? 12,
        is_new: body.isNew ?? true,
        is_best_seller: body.isBestSeller ?? true,
        is_featured: body.isFeatured ?? true,
        available_finishes: body.availableFinishes ?? ['silver', 'gold', 'black'],
        available_sizes: body.availableSizes ?? ['Tamanho Único'],
        images: body.images ?? ['/images/chain-grumet.webp'],
        category_id: body.categoryId || 'cat-correntes',
        supplier_name: body.supplierName || 'Shopee Brasil',
        supplier_url: body.supplierUrl || '',
        supplier_cost: body.supplierCost ?? 25,
        estimated_delivery_days: body.estimatedDeliveryDays || '4 a 8 dias úteis (SPX / J&T)',
      })
      .select('*, category:categories(*)')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Erro ao salvar novo produto no banco.' },
        { status: 500 }
      );
    }

    const mapped = mapProduct(data);
    revalidateCatalog(mapped.slug);

    return NextResponse.json({ product: mapped }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao criar produto.' },
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
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 });
    }

    const { data, error } = await db
      .from('products')
      .delete()
      .eq('id', id)
      .select('id, slug')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Produto não encontrado para exclusão.' }, { status: 404 });
    }

    revalidateCatalog(data.slug);

    return NextResponse.json({ deleted: true, id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao remover produto.' },
      { status: 500 }
    );
  }
}
