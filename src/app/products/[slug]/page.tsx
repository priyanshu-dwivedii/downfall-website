import { notFound } from 'next/navigation';
import { getProductBySlug, getCatalog } from '@/lib/catalog';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductPage(props: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ color?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const product = await getProductBySlug(params.slug, false); // only published on storefront
  
  if (!product) {
    return notFound();
  }

  const allPublished = await getCatalog(false);
  const related = allPublished.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <ProductDetailClient
      product={product as any}
      initialColor={searchParams.color}
      relatedProducts={related as any}
    />
  );
}
