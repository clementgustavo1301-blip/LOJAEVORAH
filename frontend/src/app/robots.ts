import type { MetadataRoute } from 'next';

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evorah.com.br';
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'https://evorah.com.br';
  }
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/produtos',
          '/produto/',
          '/garantia',
          '/trocas-e-devolucoes',
          '/privacidade',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/carrinho',
          '/rastreio',
          '/favoritos',
          '/design-system',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
