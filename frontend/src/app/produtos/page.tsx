import React from 'react';
import { FALLBACK_CATEGORIES, fetchProducts } from '@/lib/api';
import { ProductsCatalogClient } from '@/components/product/products-catalog-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const initialProducts = await fetchProducts();

  return (
    <ProductsCatalogClient
      initialProducts={initialProducts}
      categories={FALLBACK_CATEGORIES}
    />
  );
}
