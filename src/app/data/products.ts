export interface ProductVariant {
  name: string;
  hex: string;
  image: string;
  sizes: { size: string; available: boolean }[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  variants: ProductVariant[];
}

export const catalog: Product[] = [
  {
    id: 'c1',
    slug: 'classic-tee',
    name: 'CLASSIC TEE',
    description: 'Our signature everyday tee crafted from mid-weight combed cotton for a structured yet breathable drape. A slightly relaxed fit designed for effortless daily wear.',
    price: 35.00,
    currency: 'USD',
    variants: [
      { 
        name: 'Black', hex: '#111111', image: '/tee_black.jpg',
        sizes: [
          { size: 'S', available: true },
          { size: 'M', available: true },
          { size: 'L', available: true },
          { size: 'XL', available: false }
        ]
      },
      { 
        name: 'White', hex: '#FFFFFF', image: '/tee_white.jpg',
        sizes: [
          { size: 'S', available: true },
          { size: 'M', available: false },
          { size: 'L', available: true },
          { size: 'XL', available: true }
        ]
      },
      { 
        name: 'Dark Red', hex: '#6b1c23', image: '/tee_red.jpg',
        sizes: [
          { size: 'S', available: false },
          { size: 'M', available: true },
          { size: 'L', available: true },
          { size: 'XL', available: true }
        ]
      }
    ]
  },
  {
    id: 'f1',
    slug: 'tailored-blazer',
    name: 'TAILORED BLAZER',
    description: 'A modern unstructured blazer cut from a premium wool-blend. Features sharp lapels, dual vents, and a sleek, tailored profile suitable for both formal and smart-casual occasions.',
    price: 245.00,
    currency: 'USD',
    variants: [
      { 
        name: 'Black', hex: '#111111', image: '/blazer_black.jpg',
        sizes: [
          { size: '36', available: true },
          { size: '38', available: true },
          { size: '40', available: true },
          { size: '42', available: false },
          { size: '44', available: true }
        ]
      },
      { 
        name: 'Navy', hex: '#1C2841', image: '/blazer_navy.jpg',
        sizes: [
          { size: '36', available: false },
          { size: '38', available: true },
          { size: '40', available: true },
          { size: '42', available: true },
          { size: '44', available: false }
        ]
      }
    ]
  },
  {
    id: 'x1',
    slug: 'silk-evening-dress',
    name: 'SILK EVENING DRESS',
    description: 'An elegant floor-length slip dress meticulously crafted from 100% mulberry silk. Features a draped cowl neckline and a graceful bias cut that perfectly contours the body.',
    price: 850.00,
    currency: 'USD',
    variants: [
      { 
        name: 'Ivory', hex: '#F5F5F0', image: '/shop_luxury.jpg',
        sizes: [
          { size: 'XS', available: true },
          { size: 'S', available: true },
          { size: 'M', available: false },
          { size: 'L', available: true }
        ]
      }
    ]
  },
  // Bestsellers products (some overlap, some unique)
  {
    id: 'p1',
    slug: 'minimalist-black-tee',
    name: 'MINIMALIST BLACK TEE',
    description: 'A staple in any modern wardrobe. This minimalist black tee provides a sleek, versatile foundation for infinite outfit combinations.',
    price: 45.00,
    currency: 'USD',
    variants: [
      {
        name: 'Black', hex: '#111111', image: '/garment_1.jpg',
        sizes: [
          { size: 'S', available: true },
          { size: 'M', available: true },
          { size: 'L', available: true }
        ]
      }
    ]
  },
  {
    id: 'p2',
    slug: 'premium-grey-hoodie',
    name: 'PREMIUM GREY HOODIE',
    description: 'Heavyweight french terry cotton hoodie featuring a drop shoulder, oversized fit, and a kangaroo pocket. Engineered for maximum comfort and durability.',
    price: 85.00,
    currency: 'USD',
    variants: [
      {
        name: 'Grey', hex: '#555555', image: '/garment_2.jpg',
        sizes: [
          { size: 'S', available: true },
          { size: 'M', available: true },
          { size: 'L', available: false },
          { size: 'XL', available: true }
        ]
      }
    ]
  },
  {
    id: 'p3',
    slug: 'sleek-leather-jacket',
    name: 'SLEEK LEATHER JACKET',
    description: 'Constructed from full-grain leather, this jacket ages beautifully. Features minimalist silver hardware and a slightly cropped silhouette.',
    price: 320.00,
    currency: 'USD',
    variants: [
      {
        name: 'Black', hex: '#111111', image: '/garment_3.jpg',
        sizes: [
          { size: 'S', available: false },
          { size: 'M', available: false },
          { size: 'L', available: false }
        ]
      }
    ]
  },
  {
    id: 'p4',
    slug: 'white-minimalist-sneakers',
    name: 'MINIMALIST SNEAKERS',
    description: 'Premium Italian calf leather upper and lining set on a durable rubber cupsole. A clean, unbranded profile for elevated casual wear.',
    price: 120.00,
    currency: 'USD',
    variants: [
      {
        name: 'White', hex: '#FFFFFF', image: '/garment_4.jpg',
        sizes: [
          { size: '8', available: true },
          { size: '9', available: true },
          { size: '10', available: true },
          { size: '11', available: false },
          { size: '12', available: true }
        ]
      }
    ]
  }
];

export function getProductBySlug(slug: string): Product | undefined {
  return catalog.find(p => p.slug === slug);
}
