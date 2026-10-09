import { notFound } from 'next/navigation';
import { catalog, Product } from '@/app/data/products';
import CollectionClient from '../CollectionClient';

const collectionData: Record<string, { title: string; description: string; products: Product[] }> = {
  all: {
    title: 'SHOP THE ENTIRE COLLECTION',
    description: 'Explore the complete DOWNFALL collection. A meticulously curated selection of everyday essentials, refined formal wear, and luxury pieces.',
    products: catalog
  },
  basics: {
    title: 'BASICS — DAILY',
    description: 'Our signature everyday wear. Crafted for comfort, designed for effortless style.',
    products: catalog.filter(p => p.id.startsWith('c') || p.id.startsWith('p')) // some bestsellers are basics
  },
  formal: {
    title: 'FORMAL — WEAR',
    description: 'Modern tailoring for the contemporary professional. Sharp silhouettes, premium fabrics.',
    products: catalog.filter(p => p.id === 'f1')
  },
  luxury: {
    title: 'LUXURY — REFINED',
    description: 'Exquisite materials and unparalleled craftsmanship for when only the best will do.',
    products: catalog.filter(p => p.id === 'x1')
  }
};

export default async function CollectionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const collection = collectionData[params.slug];

  if (!collection) {
    return notFound();
  }

  return (
    <CollectionClient 
      slug={params.slug} 
      title={collection.title} 
      description={collection.description}
      products={collection.products} 
    />
  );
}

export function generateStaticParams() {
  return [
    { slug: 'all' },
    { slug: 'basics' },
    { slug: 'formal' },
    { slug: 'luxury' }
  ];
}
