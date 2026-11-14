'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStoredProductsSnapshot } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { Category, FinishType, Product } from '@/types';
import { SlidersHorizontal, X } from 'lucide-react';
import { FINISH_DETAILS } from '@/components/ui/swatch-selector';

interface ProductsCatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
}

function SearchParamsSync({
  onSync,
}: {
  onSync: (params: {
    category: string;
    finish: FinishType | '';
    search: string;
    bestSeller: boolean;
    isNew: boolean;
  }) => void;
}) {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const finish = (searchParams.get('finish') as FinishType) || '';
  const search = searchParams.get('search') || '';
  const bestSeller = searchParams.get('bestSeller') === 'true';
  const isNew = searchParams.get('isNew') === 'true';

  useEffect(() => {
    onSync({ category, finish, search, bestSeller, isNew });
  }, [category, finish, search, bestSeller, isNew, onSync]);

  return null;
}

export function ProductsCatalogClient({
  initialProducts,
  categories,
}: ProductsCatalogClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [onlyBestSellers, setOnlyBestSellers] = useState<boolean>(false);
  const [onlyNew, setOnlyNew] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sincroniza novos produtos salvos localmente pelo painel admin sem atrasar a pintura inicial
  useEffect(() => {
    const localSnapshot = getStoredProductsSnapshot();
    if (localSnapshot.length > 0) {
      setProducts(localSnapshot);
    }
  }, []);

  const handleSyncParams = React.useCallback(
    (params: {
      category: string;
      finish: FinishType | '';
      search: string;
      bestSeller: boolean;
      isNew: boolean;
    }) => {
      setSelectedCategory(params.category);
      setSelectedFinish(params.finish);
      setSearchFilter(params.search);
      setOnlyBestSellers(params.bestSeller);
      setOnlyNew(params.isNew);
    },
    []
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory) {
      list = list.filter(
        (p) =>
          p.categoryId === `cat-${selectedCategory}` ||
          p.slug.includes(selectedCategory)
      );
    }

    if (selectedFinish) {
      list = list.filter((p) =>
        p.availableFinishes.includes(selectedFinish as FinishType)
      );
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (onlyBestSellers) {
      list = list.filter((p) => p.isBestSeller);
    }

    if (onlyNew) {
      list = list.filter((p) => p.isNew);
    }

    if (sortBy === 'price_asc') {
      list.sort(
        (a, b) =>
          (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price)
      );
    } else if (sortBy === 'price_desc') {
      list.sort(
        (a, b) =>
          (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price)
      );
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [
    products,
    selectedCategory,
    selectedFinish,
    searchFilter,
    onlyBestSellers,
    onlyNew,
    sortBy,
  ]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedFinish('');
    setSearchFilter('');
    setOnlyBestSellers(false);
    setOnlyNew(false);
  };

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedFinish) ||
    Boolean(searchFilter) ||
    onlyBestSellers ||
    onlyNew;

  return (
    <div className="w-full bg-brand-background min-h-screen py-7 sm:py-14 px-4 sm:px-8 lg:px-12">
      <Suspense fallback={null}>
        <SearchParamsSync onSync={handleSyncParams} />
      </Suspense>

      <div className="max-w-[1240px] mx-auto">
        {/* Cabeçalho Editorial do Catálogo (Mobile-First) */}
        <div className="border-b border-brand-border pb-5 sm:pb-6 mb-5 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-1">
              Acervo EVORAH
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-normal text-brand-text tracking-tight">
              {selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)
                    ?.name || 'Coleção'
                : 'Todas as Joias'}
            </h1>
            <p className="text-xs text-brand-textMuted mt-1 tabular-nums">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1
                ? 'peça disponível'
                : 'peças disponíveis'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Ordenação */}
            <div className="flex items-center gap-2 text-xs text-brand-textMuted w-full sm:w-auto">
              <label
                htmlFor="catalog-sort"
                className="hidden sm:inline text-[11px] uppercase tracking-[0.14em]"
              >
                Ordenar:
              </label>
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto h-10 px-3 sm:px-3.5 bg-white border border-brand-border text-brand-text text-xs font-medium outline-none focus:border-brand-text cursor-pointer"
              >
                <option value="featured">Destaques</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="rating">Mais desejados</option>
              </select>
            </div>

            {/* Botão Filtros Mobile */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden h-10 px-4 bg-white border border-brand-border text-brand-text text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        {/* Chips Horizontais de Categoria para Mobile-First */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 h-8 px-3.5 text-[10px] uppercase tracking-[0.14em] font-semibold border transition-colors ${
              !selectedCategory
                ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                : 'bg-white text-brand-textMuted border-brand-border'
            }`}
          >
            Todas ({products.length})
          </button>
          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(active ? '' : cat.slug)}
                className={`shrink-0 h-8 px-3.5 text-[10px] uppercase tracking-[0.14em] font-medium border transition-colors ${
                  active
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] font-semibold'
                    : 'bg-white text-brand-textMuted border-brand-border'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Layout com Sidebar Minimalista e Grid */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Filtros Desktop */}
          <aside className="hidden lg:block w-60 shrink-0 space-y-8 bg-white p-6 border border-brand-border">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full h-9 bg-brand-background border border-brand-border text-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-1.5 hover:border-brand-text transition-colors"
              >
                <X className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Limpar filtros</span>
              </button>
            )}

            {/* Categorias */}
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text mb-4 pb-2.5 border-b border-brand-border">
                Categorias
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs py-1 transition-colors flex justify-between items-center ${
                    !selectedCategory
                      ? 'text-brand-text font-semibold'
                      : 'text-brand-textMuted hover:text-brand-text'
                  }`}
                >
                  <span>Todas as peças</span>
                  <span className="text-[11px] text-brand-textMuted tabular-nums">
                    ({products.length})
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat.slug ? '' : cat.slug
                      )
                    }
                    className={`w-full text-left text-xs py-1 transition-colors flex justify-between items-center ${
                      selectedCategory === cat.slug
                        ? 'text-brand-text font-semibold'
                        : 'text-brand-textMuted hover:text-brand-text'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] text-brand-textMuted tabular-nums">
                      (
                      {
                        products.filter(
                          (p) => p.categoryId === `cat-${cat.slug}`
                        ).length
                      }
                      )
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Acabamentos */}
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text mb-4 pb-2.5 border-b border-brand-border">
                Acabamento
              </h2>
              <div className="space-y-2">
                {(['silver', 'gold', 'black', 'bicolor'] as FinishType[]).map(
                  (finish) => {
                    const info = FINISH_DETAILS[finish];
                    const isSelected = selectedFinish === finish;

                    return (
                      <button
                        key={finish}
                        type="button"
                        onClick={() =>
                          setSelectedFinish(isSelected ? '' : finish)
                        }
                        className={`w-full text-left text-xs px-3 py-2 border transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'border-brand-text bg-brand-background text-brand-text font-medium'
                            : 'border-brand-border bg-transparent text-brand-textMuted hover:border-brand-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-3 h-3 rounded-full ${info.background} border border-black/20`}
                          />
                          <span>{info.short}</span>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-brand-gold font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Seleção */}
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text mb-4 pb-2.5 border-b border-brand-border">
                Curadoria
              </h2>
              <div className="space-y-2.5 text-xs">
                <label className="flex items-center gap-2.5 text-brand-textMuted hover:text-brand-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyBestSellers}
                    onChange={(e) => setOnlyBestSellers(e.target.checked)}
                    className="accent-[#0A0A0A] w-3.5 h-3.5"
                  />
                  <span>Mais vendidos</span>
                </label>
                <label className="flex items-center gap-2.5 text-brand-textMuted hover:text-brand-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={(e) => setOnlyNew(e.target.checked)}
                    className="accent-[#0A0A0A] w-3.5 h-3.5"
                  />
                  <span>Lançamentos</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Grid de Produtos */}
          <div className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center bg-white border border-brand-border p-10">
                <h3 className="font-serif text-2xl font-normal text-brand-text mb-2">
                  Nenhuma joia encontrada
                </h3>
                <p className="text-xs text-brand-textMuted mb-6">
                  Ajuste os filtros selecionados para visualizar outras opções do acervo.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 px-7 bg-[#0A0A0A] text-white font-semibold text-[11px] uppercase tracking-[0.16em] hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-3.5 gap-y-7 sm:gap-x-7 sm:gap-y-10">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 2}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer de Filtros Mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden flex justify-end">
          <div className="w-4/5 max-w-xs bg-white border-l border-brand-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-luxury">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text">
                  Filtrar Acervo
                </span>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-brand-textMuted hover:text-brand-text p-1"
                  aria-label="Fechar filtros"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text mb-3">
                  Categorias
                </h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(
                          selectedCategory === cat.slug ? '' : cat.slug
                        );
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left text-xs py-1.5 ${
                        selectedCategory === cat.slug
                          ? 'text-brand-text font-semibold'
                          : 'text-brand-textMuted'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full h-11 bg-[#0A0A0A] text-white font-semibold text-[11px] uppercase tracking-[0.16em] hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors"
            >
              Ver {filteredProducts.length} peças
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

