import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
import CollectionClient from '../CollectionClient';

export const dynamic = 'force-dynamic';

const collectionMetadata: Record<string, { title: string; description: string }> = {
  all: {
    title: 'SHOP THE ENTIRE COLLECTION',
    description: 'Explore the complete DOWNFALL collection. A meticulously curated selection of everyday essentials, refined formal wear, and luxury pieces.',
  },
  basics: {
    title: 'BASICS — DAILY',
    description: 'Our signature everyday wear. Crafted for comfort, designed for effortless style.',
  },
  formal: {
    title: 'FORMAL — WEAR',
    description: 'Modern tailoring for the contemporary professional. Sharp silhouettes, premium fabrics.',
  },
  luxury: {
    title: 'LUXURY — REFINED',
    description: 'Exquisite materials and unparalleled craftsmanship for when only the best will do.',
  },
};

export default async function CollectionPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const meta = collectionMetadata[params.slug];

  if (!meta) {
    return notFound();
  }

  const published = await getCatalog(false);
  let products = published;

  if (params.slug === 'basics') {
    products = published.filter((p) => p.category === 'basics' || p.id.startsWith('c') || p.id.startsWith('p'));
  } else if (params.slug === 'formal') {
    products = published.filter((p) => p.category === 'formal' || p.id === 'f1');
  } else if (params.slug === 'luxury') {
    products = published.filter((p) => p.category === 'luxury' || p.id === 'x1');
  }

  return (
    <CollectionClient 
      slug={params.slug} 
      title={meta.title} 
      description={meta.description}
      products={products as any} 
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
