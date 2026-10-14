import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/catalog';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wantsPreview = url.searchParams.get('preview') === 'true' || url.searchParams.get('includeDrafts') === 'true';

  let includeDrafts = false;
  if (wantsPreview) {
    try {
      const session = await getAdminSession();
      includeDrafts = Boolean(session.authenticated);
    } catch {
      includeDrafts = false;
    }
  }

  // Anonymous callers strictly receive published products only
  const products = await getCatalog(includeDrafts);
  return NextResponse.json({
    products,
    timestamp: new Date().toISOString(),
  });
}
