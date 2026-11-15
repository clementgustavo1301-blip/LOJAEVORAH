import React from 'react';
import type { Metadata } from 'next';
import { fetchProductBySlug, fetchProducts } from '@/lib/api';
import { ProductDetailClient } from '@/components/product/product-detail-client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evorah.com.br';
  try {
    return new URL(raw).toString().replace(/\/$/, '');
  } catch {
    return 'https://evorah.com.br';
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    return {
      title: 'Peça não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const description =
    (product.description || '').slice(0, 158) ||
    `${product.name} em ${product.material} com acabamento de joalheria e garantia vitalícia contra oxidação.`;
  const primaryImage = product.images?.[0] || '/images/editorial-hand.webp';

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/produto/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | EVORAH`,
      description,
      url: `/produto/${product.slug}`,
      images: [
        {
          url: primaryImage,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, allProducts] = await Promise.all([
    fetchProductBySlug(slug),
    fetchProducts(),
  ]);

  const relatedProducts = allProducts
    .filter((p) => p.slug !== slug && p.id !== product?.id)
    .slice(0, 4);

  const siteUrl = getSiteUrl();
  const effectivePrice = product
    ? Number(product.promotionalPrice || product.price).toFixed(2)
    : null;

  const productJsonLd = product
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${siteUrl}/produto/${product.slug}#product`,
            name: product.name,
            description: product.description,
            image: product.images,
            sku: product.id,
            material: product.material || 'Aço Cirúrgico 316L',
            brand: {
              '@type': 'Brand',
              name: 'EVORAH',
            },
            offers: {
              '@type': 'Offer',
              url: `${siteUrl}/produto/${product.slug}`,
              priceCurrency: 'BRL',
              price: effectivePrice,
              availability: 'https://schema.org/InStock',
              itemCondition: 'https://schema.org/NewCondition',
            },
            ...(product.reviewsCount > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: Number(product.rating || 5).toFixed(1),
                    reviewCount: product.reviewsCount,
                  },
                }
              : {}),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Início',
                item: `${siteUrl}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Catálogo',
                item: `${siteUrl}/produtos`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.name,
                item: `${siteUrl}/produto/${product.slug}`,
              },
            ],
          },
        ],
      }).replace(/</g, '\\u003c')
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: productJsonLd }}
        />
      )}
      <ProductDetailClient
        initialProduct={product}
        relatedProducts={relatedProducts}
        slug={slug}
      />
    </>
  );
}
