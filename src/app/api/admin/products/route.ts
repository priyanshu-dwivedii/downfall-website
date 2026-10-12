import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { getCatalog, saveProduct } from '@/lib/catalog';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const products = await getCatalog(true); // include drafts & archived
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await request.json();

    // Validation
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    }

    if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0) {
      return NextResponse.json({ error: 'Valid positive price is required.' }, { status: 400 });
    }

    if (!data.category || !['basics', 'formal', 'luxury'].includes(data.category)) {
      return NextResponse.json({ error: 'Valid category (basics, formal, or luxury) is required.' }, { status: 400 });
    }

    const result = await saveProduct({
      ...data,
      name: data.name.trim(),
      price: Number(data.price),
    });

    return NextResponse.json(
      {
        success: true,
        product: result.product,
        message: result.isNew ? 'Product created successfully' : 'Product updated successfully',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save product' }, { status: 500 });
  }
}
