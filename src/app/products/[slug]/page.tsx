import { notFound } from 'next/navigation';
import { getProductBySlug, getCatalog } from '@/lib/catalog';
import { getAdminSession } from '@/lib/auth';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductPage(props: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ color?: string; preview?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Strict server-side admin authorization for draft preview access.
  // A preview=true query parameter alone must NEVER expose a draft to anonymous visitors.
  const isPreviewRequested = searchParams.preview === 'true';
  let isAuthorizedAdmin = false;

  if (isPreviewRequested) {
    try {
      const session = await getAdminSession();
      isAuthorizedAdmin = Boolean(session.authenticated);
    } catch {
      isAuthorizedAdmin = false;
    }
  }

  const isAuthorizedPreview = isPreviewRequested && isAuthorizedAdmin;
  const product = await getProductBySlug(params.slug, isAuthorizedPreview);
  
  if (!product) {
    return notFound();
  }

  // Ensure unpublished products are never displayed without authorized admin preview
  if (product.status !== 'published' && !isAuthorizedPreview) {
    return notFound();
  }

  const allPublished = await getCatalog(false);
  const related = allPublished.filter((p) => p.id !== product.id && p.status === 'published').slice(0, 4);

  return (
    <ProductDetailClient
      product={product as any}
      initialColor={searchParams.color}
      relatedProducts={related as any}
    />
  );
}
