import { NextResponse } from 'next/server';
import { getProductById } from '@/lib/catalog';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface EnquiryValidateItem {
  productId: string;
  variantName: string;
  size: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: EnquiryValidateItem[] = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Cannot validate an empty enquiry. No items provided.' },
        { status: 400 }
      );
    }

    const session = await getAdminSession();
    const isAuthorizedAdmin = Boolean(session.authenticated);

    const rejectedItems: Array<{
      productId: string;
      productName: string;
      status: string;
      reason: string;
    }> = [];

    for (const item of items) {
      const product = await getProductById(item.productId);

      if (!product) {
        rejectedItems.push({
          productId: item.productId,
          productName: item.productId,
          status: 'not_found',
          reason: 'Garment not found in catalog.',
        });
        continue;
      }

      if (product.status !== 'published') {
        if (!isAuthorizedAdmin) {
          rejectedItems.push({
            productId: item.productId,
            productName: product.name,
            status: product.status,
            reason: `"${product.name}" is an unpublished draft and cannot be ordered or enquired by public visitors.`,
          });
        }
      }
    }

    if (rejectedItems.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Public enquiry validation failed: Unpublished or unavailable products found in bag.',
          rejectedItems,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: 'All items validated for enquiry.',
      isAuthorizedAdmin,
    });
  } catch (error: any) {
    console.error('Enquiry validation error:', error);
    return NextResponse.json(
      { valid: false, error: error.message || 'Internal validation error' },
      { status: 500 }
    );
  }
}
