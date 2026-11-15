import type { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

const CATEGORY_SLUGS = [
  'correntes',
  'aneis',
  'pulseiras',
  'pingentes',
  'cordoes',
  'brincos',
];

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evorah.com.br';
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'https://evorah.com.br';
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const products = await fetchProducts().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/produtos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/garantia`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/trocas-e-devolucoes`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacidade`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${siteUrl}/produtos?category=${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug))
    .map((product) => ({
      url: `${siteUrl}/produto/${product.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
