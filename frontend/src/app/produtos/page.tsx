import React from 'react';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { ProductsCatalogClient } from '@/components/product/products-catalog-client';
import { FinishType } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    finish?: string;
    search?: string;
    bestSeller?: string;
    isNew?: string;
  }>;
}) {
  const [resolvedParams, initialProducts, categories] = await Promise.all([
    searchParams,
    fetchProducts(),
    fetchCategories(),
  ]);

  return (
    <ProductsCatalogClient
      initialProducts={initialProducts}
      categories={categories}
      initialFilters={{
        category: resolvedParams.category || '',
        finish: (resolvedParams.finish as FinishType) || '',
        search: resolvedParams.search || '',
        bestSeller: resolvedParams.bestSeller === 'true',
        isNew: resolvedParams.isNew === 'true',
      }}
    />
  );
}
