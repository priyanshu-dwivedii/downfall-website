import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getCatalog(false); // Only published products for storefront
  return NextResponse.json({
    products,
    timestamp: new Date().toISOString(),
  });
}
