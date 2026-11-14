import React from 'react';
import { fetchProductBySlug, fetchProducts } from '@/lib/api';
import { ProductDetailClient } from '@/components/product/product-detail-client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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

  return (
    <ProductDetailClient
      initialProduct={product}
      relatedProducts={relatedProducts}
      slug={slug}
    />
  );
}
