import React from 'react';
import type { Metadata } from 'next';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { ProductsCatalogClient } from '@/components/product/products-catalog-client';
import { FinishType } from '@/types';

export const dynamic = 'force-dynamic';

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  correntes: {
    title: 'Correntes em Aço Cirúrgico 316L e Prata 925',
    description:
      'Correntes grumet, cartier e elos diamantados à prova d\'água e hipoalergênicos com garantia vitalícia contra oxidação.',
  },
  aneis: {
    title: 'Anéis em Aço Cirúrgico 316L e Prata 925',
    description:
      'Anéis masculinos e unissex maciços, polidos e escovados que não oxidam nem escurecem na água.',
  },
  pulseiras: {
    title: 'Pulseiras e Braceletes em Aço 316L',
    description:
      'Pulseiras e braceletes com fecho de precisão e resistência à água, suor e perfume.',
  },
  pingentes: {
    title: 'Pingentes Minimalistas e Cruz em Aço 316L',
    description:
      'Pingentes geométricos, placas e cruzes lapidadas à laser em Aço Cirúrgico 316L hipoalergênico.',
  },
  cordoes: {
    title: 'Cordões Baianos e Trançados em Aço 316L',
    description:
      'Cordões trançados e venezianos com brilho constante para uso diário.',
  },
  brincos: {
    title: 'Brincos e Argolas Hipoalergênicos em Aço 316L',
    description:
      'Brincos e argolas livres de níquel reativo, ideais para peles sensíveis e uso contínuo.',
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    finish?: string;
    search?: string;
    bestSeller?: string;
    isNew?: string;
  }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = (params.category || '').toLowerCase();
  const catMeta = CATEGORY_SEO[category];

  if (catMeta) {
    return {
      title: catMeta.title,
      description: catMeta.description,
      alternates: { canonical: `/produtos?category=${category}` },
    };
  }

  if (params.bestSeller === 'true') {
    return {
      title: 'Peças Mais Desejadas | Seleção EVORAH',
      description:
        'As joias em Aço Cirúrgico 316L e Prata 925 mais procuradas da coleção EVORAH.',
      alternates: { canonical: '/produtos?bestSeller=true' },
    };
  }

  if (params.isNew === 'true') {
    return {
      title: 'Lançamentos Recentes em Joias 316L',
      description:
        'Novidades em correntes, pulseiras, anéis e pingentes EVORAH com acabamento de alto brilho.',
      alternates: { canonical: '/produtos?isNew=true' },
    };
  }

  return {
    title: 'Catálogo Completo | Joias em Aço 316L & Prata 925',
    description:
      'Explore todo o catálogo EVORAH EXPERIENCE: correntes, anéis, pulseiras, cordões, pingentes e brincos resistentes à água com garantia vitalícia.',
    alternates: { canonical: '/produtos' },
    robots: params.search ? { index: false, follow: true } : undefined,
  };
}

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
