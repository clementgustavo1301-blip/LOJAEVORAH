import React from 'react';
import { FALLBACK_CATEGORIES, fetchProducts } from '@/lib/api';
import { ProductsCatalogClient } from '@/components/product/products-catalog-client';

export const revalidate = 120;

export default async function ProductsPage() {
  const initialProducts = await fetchProducts();

  return (
    <ProductsCatalogClient
      initialProducts={initialProducts}
      categories={FALLBACK_CATEGORIES}
    />
  );
}
