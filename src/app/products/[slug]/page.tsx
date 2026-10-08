import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/app/data/products';
import ProductDetailClient from './ProductDetailClient';

export default async function ProductPage(props: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ color?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const product = getProductBySlug(params.slug);
  
  if (!product) {
    return notFound();
  }

  return (
    <ProductDetailClient product={product} initialColor={searchParams.color} />
  );
}
