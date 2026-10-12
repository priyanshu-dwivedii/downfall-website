import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import {
  getProductById,
  saveProduct,
  deleteProduct,
  setProductStatus,
  ConcurrencyConflictError,
} from '@/lib/catalog';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await props.params;
  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  try {
    const data = await request.json();

    if (data.name !== undefined && !data.name.trim()) {
      return NextResponse.json({ error: 'Product name cannot be empty.' }, { status: 400 });
    }

    if (data.price !== undefined && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
      return NextResponse.json({ error: 'Price must be a valid positive number.' }, { status: 400 });
    }

    const updated = await saveProduct({
      ...existing,
      ...data,
      id,
      expectedVersion: data.version,
      expectedUpdatedAt: data.updatedAt,
    });

    return NextResponse.json({
      success: true,
      product: updated.product,
      message: 'Product updated successfully.',
    });
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError || err.name === 'ConcurrencyConflictError') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await props.params;
  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // 'delete' or 'archive'

  if (action === 'archive') {
    const archived = await setProductStatus(id, 'archived');
    if (!archived) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Product archived successfully.', product: archived });
  }

  const deleted = await deleteProduct(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Product permanently removed.' });
}
