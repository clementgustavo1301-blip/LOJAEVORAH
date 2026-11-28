import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerContext } from '@/lib/customer-api-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID de endereço inválido.' }, { status: 400 });
  }

  const { user, db } = ctx;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.label !== undefined) {
      updates.label = String(body.label).trim().slice(0, 40) || 'Principal';
    }
    if (body.recipientName !== undefined) {
      updates.recipient_name = String(body.recipientName).trim().slice(0, 120) || null;
    }
    if (body.cep !== undefined) {
      const cepDigits = String(body.cep).replace(/\D/g, '').slice(0, 8);
      if (cepDigits.length !== 8) {
        return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 });
      }
      updates.cep = `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}`;
    }
    if (body.street !== undefined) updates.street = String(body.street).trim().slice(0, 160);
    if (body.number !== undefined) updates.number = String(body.number).trim().slice(0, 24);
    if (body.complement !== undefined) {
      updates.complement = String(body.complement).trim().slice(0, 120) || null;
    }
    if (body.neighborhood !== undefined) {
      updates.neighborhood = String(body.neighborhood).trim().slice(0, 100);
    }
    if (body.city !== undefined) updates.city = String(body.city).trim().slice(0, 100);
    if (body.state !== undefined) {
      updates.state = String(body.state).trim().toUpperCase().slice(0, 2);
    }

    if (body.isDefault === true) {
      await db
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      updates.is_default = true;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração enviada.' }, { status: 400 });
    }

    const { data: updated, error } = await db
      .from('customer_addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, label, recipient_name, cep, street, number, complement, neighborhood, city, state, is_default, created_at')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar endereço.' }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: 'Endereço não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      address: {
        id: updated.id,
        label: updated.label || 'Principal',
        recipientName: updated.recipient_name || '',
        cep: updated.cep,
        street: updated.street,
        number: updated.number,
        complement: updated.complement || '',
        neighborhood: updated.neighborhood,
        city: updated.city,
        state: updated.state,
        isDefault: Boolean(updated.is_default),
        createdAt: updated.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthenticatedCustomerContext();
  if ('error' in ctx) return ctx.error;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'ID de endereço inválido.' }, { status: 400 });
  }

  const { user, db } = ctx;
  const { error } = await db
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao remover endereço.' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
