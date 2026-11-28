'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion } from 'motion/react';
import { useCart, KitSelectionEntry } from '@/context/cart-context';
import { fetchCategories, fetchProducts, getStoredProductsSnapshot } from '@/lib/api';
import {
  calculateKitDiscountPercent,
  DEFAULT_KIT_SETTINGS,
  getNextKitTier,
  sanitizeKitSettings,
} from '@/lib/kit-pricing';
import { FINISH_DETAILS } from '@/components/ui/swatch-selector';
import type { Category, FinishType, KitSettings, Product } from '@/types';
import {
  ArrowRight,
  Check,
  ChevronUp,
  Layers,
  Loader2,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface SelectedKitSlot extends KitSelectionEntry {
  slotId: string;
  unitPrice: number;
}

interface KitBuilderClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialSettings: KitSettings;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function KitBuilderClient({
  initialProducts,
  initialCategories,
  initialSettings,
}: KitBuilderClientProps) {
  const router = useRouter();
  const { addKitToCart } = useCart();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [settings, setSettings] = useState<KitSettings>(sanitizeKitSettings(initialSettings));
  const [loadingCatalog, setLoadingCatalog] = useState(initialProducts.length === 0);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeFinishFilter, setActiveFinishFilter] = useState<FinishType | 'all'>('all');
  const [selectedFinishByProduct, setSelectedFinishByProduct] = useState<Record<string, FinishType>>({});
  const [selectedSizeByProduct, setSelectedSizeByProduct] = useState<Record<string, string>>({});
  const [selectedSlots, setSelectedSlots] = useState<SelectedKitSlot[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;

    if (initialProducts.length === 0) {
      const snap = getStoredProductsSnapshot();
      if (snap.length > 0) setProducts(snap);
    }

    Promise.all([
      fetchProducts({ fresh: true }).catch(() => initialProducts),
      fetchCategories().catch(() => initialCategories),
      fetch('/api/kit-settings', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([remoteProducts, remoteCategories, settingsRes]) => {
      if (!active) return;
      if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        setProducts(remoteProducts);
      }
      if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
        setCategories(remoteCategories);
      }
      if (settingsRes?.settings) {
        setSettings(sanitizeKitSettings(settingsRes.settings));
      }
      setLoadingCatalog(false);
    });

    return () => {
      active = false;
    };
  }, [initialProducts, initialCategories]);

  const categoriesWithProducts = useMemo(() => {
    const usedIds = new Set(products.map((p) => p.categoryId).filter(Boolean));
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeCategory !== 'all' && product.categoryId !== activeCategory) {
        return false;
      }
      if (
        activeFinishFilter !== 'all' &&
        !product.availableFinishes.includes(activeFinishFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [products, activeCategory, activeFinishFilter]);

  const kitCount = selectedSlots.length;
  const isKitFull = kitCount >= settings.maxItems;
  const canFinishKit = settings.enabled && kitCount >= settings.minItems;

  const kitSubtotal = useMemo(
    () => selectedSlots.reduce((acc, s) => acc + s.unitPrice, 0),
    [selectedSlots]
  );

  const discountPercent = useMemo(
    () => calculateKitDiscountPercent(kitCount, settings),
    [kitCount, settings]
  );

  const discountValue = useMemo(
    () => Math.round(kitSubtotal * (discountPercent / 100) * 100) / 100,
    [kitSubtotal, discountPercent]
  );

  const kitTotal = Math.max(0, Math.round((kitSubtotal - discountValue) * 100) / 100);
  const nextTier = useMemo(() => getNextKitTier(kitCount, settings), [kitCount, settings]);
  const highestTierMin = settings.tiers[settings.tiers.length - 1]?.minItems || settings.minItems;
  const progressPercent = Math.min(100, Math.round((kitCount / Math.max(1, highestTierMin)) * 100));

  const getProductFinish = (product: Product): FinishType => {
    const chosen = selectedFinishByProduct[product.id];
    if (chosen && product.availableFinishes.includes(chosen)) return chosen;
    if (activeFinishFilter !== 'all' && product.availableFinishes.includes(activeFinishFilter)) {
      return activeFinishFilter;
    }
    return product.availableFinishes[0] || 'silver';
  };

  const getProductSize = (product: Product): string | undefined => {
    const chosen = selectedSizeByProduct[product.id];
    if (chosen) return chosen;
    return product.availableSizes[0] || undefined;
  };

  const handleAddSlot = (product: Product) => {
    if (isKitFull || !settings.enabled) return;
    const finish = getProductFinish(product);
    const size = getProductSize(product);
    const unitPrice = product.promotionalPrice || product.price;

    setSelectedSlots((prev) => [
      ...prev,
      {
        slotId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product,
        finish,
        size,
        unitPrice,
      },
    ]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSelectedSlots((prev) => prev.filter((s) => s.slotId !== slotId));
  };

  const handleClearKit = () => {
    setSelectedSlots([]);
  };

  const handleConfirmKit = (goToCheckout: boolean) => {
    if (!canFinishKit) return;
    const entries: KitSelectionEntry[] = selectedSlots.map((s) => ({
      product: s.product,
      finish: s.finish,
      size: s.size,
    }));
    addKitToCart(entries, !goToCheckout);
    setSelectedSlots([]);
    setMobileDrawerOpen(false);
    if (goToCheckout) {
      router.push('/checkout');
    }
  };

  const countInKitByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of selectedSlots) {
      map.set(s.product.id, (map.get(s.product.id) || 0) + 1);
    }
    return map;
  }, [selectedSlots]);

  if (!settings.enabled) {
    return (
      <div className="w-full min-h-[65vh] bg-brand-background py-20 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-brand-border p-10 text-center space-y-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            EVORAH Atelier
          </span>
          <h1 className="font-serif text-3xl text-brand-text">
            Monte seu Kit temporariamente indisponível
          </h1>
          <p className="text-xs text-brand-textMuted leading-relaxed">
            Estamos atualizando nossa curadoria de kits personalizados. Enquanto isso, explore todas as joias no nosso acervo completo.
          </p>
          <Link
            href="/produtos"
            className="inline-flex h-11 px-7 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] items-center gap-2 transition-colors"
          >
            <span>Explorar acervo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full flex-1 bg-brand-background pb-28 lg:pb-16">
        {/* Cabeçalho Editorial Obsidian */}
        <section className="w-full bg-[#0A0A0A] text-[#FAF9F6] border-b border-white/10">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EVORAH Atelier • Composição Personalizada</span>
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-white leading-[1.08]">
                  {settings.title || DEFAULT_KIT_SETTINGS.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#A3A7AE] max-w-xl leading-relaxed">
                  {settings.subtitle} Escolha livremente de {settings.minItems} a {settings.maxItems}{' '}
                  peças com acabamento e tamanho individuais.
                </p>
              </div>

              {/* Régua de Descontos Progressivos */}
              <div className="lg:col-span-5">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#A3A7AE] block mb-2.5">
                  Desconto progressivo (máx. {settings.maxDiscountPercent}% OFF)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {settings.tiers.slice(0, 3).map((tier, idx) => {
                    const reached = kitCount >= tier.minItems;
                    const isLast = idx === Math.min(settings.tiers.length, 3) - 1;
                    return (
                      <div
                        key={tier.minItems}
                        className={`p-3 border transition-colors ${
                          reached
                            ? 'border-brand-gold bg-brand-gold/15 text-white'
                            : 'border-white/15 bg-white/[0.03] text-[#A3A7AE]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] uppercase tracking-[0.14em] font-mono tabular-nums">
                            {tier.minItems}
                            {isLast && settings.maxItems > tier.minItems ? '+' : ''} peças
                          </span>
                          {reached && <Check className="w-3.5 h-3.5 text-brand-gold shrink-0" />}
                        </div>
                        <p
                          className={`font-serif text-xl sm:text-2xl mt-1 tabular-nums ${
                            reached ? 'text-brand-gold' : 'text-white'
                          }`}
                        >
                          {tier.discountPercent}% OFF
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Filtros */}
        <div className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-brand-border">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-12 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`shrink-0 h-8 px-3.5 text-[10.5px] uppercase tracking-[0.14em] border transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white font-semibold'
                    : 'bg-white border-brand-border text-brand-textMuted hover:border-brand-text hover:text-brand-text'
                }`}
              >
                Todas ({products.length})
              </button>

              {categoriesWithProducts.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 h-8 px-3.5 text-[10.5px] uppercase tracking-[0.14em] border transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white font-semibold'
                      : 'bg-white border-brand-border text-brand-textMuted hover:border-brand-text hover:text-brand-text'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.16em] text-brand-textMuted mr-1 hidden sm:inline">
                Banho:
              </span>
              {(['all', 'silver', 'gold', 'black'] as const).map((finish) => {
                const isSelected = activeFinishFilter === finish;
                const label =
                  finish === 'all' ? 'Todos' : FINISH_DETAILS[finish]?.short || finish;
                return (
                  <button
                    key={finish}
                    type="button"
                    onClick={() => setActiveFinishFilter(finish)}
                    className={`h-8 px-2.5 text-[10px] uppercase tracking-[0.12em] border flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'border-[#0A0A0A] bg-brand-background text-brand-text font-semibold'
                        : 'border-brand-border bg-white text-brand-textMuted hover:border-brand-text'
                    }`}
                  >
                    {finish !== 'all' && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full border border-black/20 ${FINISH_DETAILS[finish].background}`}
                      />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corpo Principal: Catálogo (8 cols) + Caixa Obsidian do Kit (4 cols) */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-12 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Grade de Peças Selecionáveis */}
            <div className="lg:col-span-8">
              {loadingCatalog ? (
                <div className="bg-white border border-brand-border p-14 flex items-center justify-center gap-3 text-xs text-brand-textMuted">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                  <span>Carregando acervo EVORAH...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border border-brand-border p-12 text-center space-y-3">
                  <p className="font-serif text-xl text-brand-text">
                    Nenhuma peça encontrada nesse filtro
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveFinishFilter('all');
                    }}
                    className="h-9 px-5 border border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] hover:bg-[#0A0A0A] hover:text-white transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => {
                    const activeFinish = getProductFinish(product);
                    const activeSize = getProductSize(product);
                    const unitPrice = product.promotionalPrice || product.price;
                    const inKitCount = countInKitByProduct.get(product.id) || 0;
                    const primaryImage = product.images[0] || '/images/chain-grumet.webp';

                    return (
                      <motion.article
                        key={product.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28 }}
                        className={`bg-white border flex flex-col justify-between transition-colors ${
                          inKitCount > 0 ? 'border-[#0A0A0A]' : 'border-brand-border'
                        }`}
                      >
                        <div>
                          {/* Moldura 4:5 */}
                          <div className="relative aspect-[4/5] bg-brand-background overflow-hidden border-b border-brand-border">
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                            />
                            {inKitCount > 0 && (
                              <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#0A0A0A] text-brand-gold text-[10px] font-semibold uppercase tracking-[0.14em] tabular-nums">
                                {inKitCount} no kit
                              </span>
                            )}
                          </div>

                          {/* Metadados + Seletores Inline */}
                          <div className="p-4 space-y-3">
                            <div>
                              <Link
                                href={`/produto/${product.slug}`}
                                className="text-sm font-medium text-brand-text hover:text-brand-gold transition-colors line-clamp-2 leading-snug"
                              >
                                {product.name}
                              </Link>
                              <p className="text-[11px] text-brand-textMuted mt-0.5 truncate">
                                {product.material}
                              </p>
                            </div>

                            <div className="flex items-baseline gap-2 tabular-nums">
                              <span className="text-base font-semibold text-brand-text">
                                {formatBRL(unitPrice)}
                              </span>
                              {product.promotionalPrice && product.promotionalPrice < product.price && (
                                <span className="text-xs text-brand-textMuted line-through">
                                  {formatBRL(product.price)}
                                </span>
                              )}
                            </div>

                            {/* Seletor de Acabamento */}
                            {product.availableFinishes.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-brand-textMuted block">
                                  Acabamento:{' '}
                                  <strong className="text-brand-text font-semibold">
                                    {FINISH_DETAILS[activeFinish]?.short || activeFinish}
                                  </strong>
                                </span>
                                <div className="flex items-center gap-2">
                                  {product.availableFinishes.map((fin) => {
                                    const info = FINISH_DETAILS[fin] || FINISH_DETAILS.silver;
                                    const selected = activeFinish === fin;
                                    return (
                                      <button
                                        key={fin}
                                        type="button"
                                        onClick={() =>
                                          setSelectedFinishByProduct((prev) => ({
                                            ...prev,
                                            [product.id]: fin,
                                          }))
                                        }
                                        title={info.label}
                                        aria-label={`Selecionar acabamento ${info.label}`}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                          selected
                                            ? 'ring-2 ring-offset-1 ring-[#0A0A0A]'
                                            : 'ring-1 ring-brand-border hover:ring-brand-text'
                                        }`}
                                      >
                                        <span
                                          className={`w-4 h-4 rounded-full ${info.background} border border-black/15`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Seletor de Tamanho */}
                            {product.availableSizes.length > 1 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-brand-textMuted block">
                                  Tamanho
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.availableSizes.map((sz) => {
                                    const selected = activeSize === sz;
                                    return (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() =>
                                          setSelectedSizeByProduct((prev) => ({
                                            ...prev,
                                            [product.id]: sz,
                                          }))
                                        }
                                        className={`h-7 px-2.5 text-[11px] border tabular-nums transition-colors ${
                                          selected
                                            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white font-semibold'
                                            : 'bg-brand-background border-brand-border text-brand-text hover:border-brand-text'
                                        }`}
                                      >
                                        {sz}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ação Adicionar ao Kit */}
                        <div className="p-4 pt-0">
                          <button
                            type="button"
                            disabled={isKitFull}
                            onClick={() => handleAddSlot(product)}
                            className={`w-full h-10 text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                              inKitCount > 0
                                ? 'bg-brand-background border border-[#0A0A0A] text-brand-text hover:bg-[#0A0A0A] hover:text-white'
                                : 'bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A]'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              {isKitFull
                                ? `Kit completo (${settings.maxItems}/${settings.maxItems})`
                                : inKitCount > 0
                                  ? 'Adicionar outra ao kit'
                                  : 'Adicionar ao kit'}
                            </span>
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Caixa Lateral Obsidian Fixa (Desktop) */}
            <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-40 bg-[#0A0A0A] text-[#FAF9F6] border border-[#0A0A0A]">
              <div className="h-[2px] w-full bg-brand-gold" />
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/15">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
                      Seu Kit EVORAH
                    </span>
                    <p className="text-xs text-[#A3A7AE] mt-0.5 tabular-nums">
                      {kitCount} de {settings.maxItems} peças selecionadas
                    </p>
                  </div>
                  {kitCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearKit}
                      className="text-[11px] text-[#A3A7AE] hover:text-white underline underline-offset-4 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Progresso do Desconto */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    {discountPercent > 0 ? (
                      <span className="text-brand-gold font-semibold">
                        {discountPercent}% OFF desbloqueado
                      </span>
                    ) : (
                      <span className="text-[#A3A7AE]">
                        Escolha {Math.max(0, settings.minItems - kitCount)}{' '}
                        {settings.minItems - kitCount === 1 ? 'peça' : 'peças'} para ativar o kit
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[#A3A7AE] tabular-nums">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="w-full h-[3px] bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-brand-gold transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {nextTier ? (
                    <p className="text-[11px] text-[#A3A7AE]">
                      Adicione mais{' '}
                      <strong className="text-white">
                        {nextTier.minItems - kitCount}{' '}
                        {nextTier.minItems - kitCount === 1 ? 'peça' : 'peças'}
                      </strong>{' '}
                      para chegar a{' '}
                      <strong className="text-brand-gold">{nextTier.discountPercent}% OFF</strong>.
                    </p>
                  ) : (
                    discountPercent > 0 && (
                      <p className="text-[11px] text-[#6EE7B7]">
                        Desconto máximo do kit ({discountPercent}% OFF) atingido.
                      </p>
                    )
                  )}
                </div>

                {/* Slots Visuais */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {Array.from({ length: settings.maxItems }).map((_, idx) => {
                    const slot = selectedSlots[idx];
                    if (!slot) {
                      const isRequired = idx < settings.minItems;
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="p-3 border border-dashed border-white/15 flex items-center justify-between text-xs text-white/40"
                        >
                          <span className="font-mono text-[10px]">0{idx + 1}</span>
                          <span>
                            {isRequired ? 'Peça obrigatória do kit' : 'Slot opcional do kit'}
                          </span>
                          <Layers className="w-3.5 h-3.5 opacity-40" />
                        </div>
                      );
                    }

                    const finishInfo = FINISH_DETAILS[slot.finish] || FINISH_DETAILS.silver;
                    return (
                      <div
                        key={slot.slotId}
                        className="p-2.5 bg-white/[0.04] border border-white/15 flex items-center gap-3"
                      >
                        <div className="relative w-11 h-12 bg-white/10 shrink-0 overflow-hidden">
                          <Image
                            src={slot.product.images[0] || '/images/chain-grumet.webp'}
                            alt={slot.product.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">
                            {slot.product.name}
                          </p>
                          <p className="text-[11px] text-[#A3A7AE] mt-0.5 flex items-center gap-1.5">
                            <span>{finishInfo.short}</span>
                            {slot.size && <span>• {slot.size}</span>}
                            <span className="text-brand-gold tabular-nums">
                              • {formatBRL(slot.unitPrice)}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.slotId)}
                          className="p-1.5 text-white/50 hover:text-white transition-colors shrink-0"
                          aria-label={`Remover ${slot.product.name} do kit`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Totais */}
                <div className="pt-4 border-t border-white/15 space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between text-[#A3A7AE]">
                    <span>Subtotal das peças</span>
                    <span className="text-white">{formatBRL(kitSubtotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-[#6EE7B7] font-medium">
                      <span>Desconto Kit ({discountPercent}%)</span>
                      <span>- {formatBRL(discountValue)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between pt-2.5 border-t border-white/15">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-[#A3A7AE]">
                      Total do Kit
                    </span>
                    <span className="font-serif text-2xl font-medium text-brand-gold">
                      {formatBRL(kitTotal)}
                    </span>
                  </div>
                  {kitTotal > 0 && (
                    <p className="text-[11px] text-[#A3A7AE] text-right">
                      em até 6x de {formatBRL(kitTotal / 6)} sem juros
                    </p>
                  )}
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    disabled={!canFinishKit}
                    onClick={() => handleConfirmKit(false)}
                    className="w-full h-11 bg-brand-gold hover:bg-[#DFC383] text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {canFinishKit
                        ? 'Adicionar Kit à Sacola'
                        : `Selecione ao menos ${settings.minItems} peças`}
                    </span>
                  </button>

                  {canFinishKit && (
                    <button
                      type="button"
                      onClick={() => handleConfirmKit(true)}
                      className="w-full h-10 border border-white/25 hover:border-brand-gold text-white hover:text-brand-gold text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Finalizar compra agora</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-[#A3A7AE] leading-relaxed text-center">
                  Desconto máximo de {settings.maxDiscountPercent}% por kit (não acumula com cupons promocionais).
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* Barra Fixa Mobile do Kit */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] text-white border-t border-brand-gold/40 px-4 py-3 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="text-left min-w-0 flex-1"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-brand-gold font-semibold">
                <span>
                  Seu Kit ({kitCount}/{settings.maxItems})
                </span>
                {discountPercent > 0 && <span>• {discountPercent}% OFF</span>}
                <ChevronUp className="w-3.5 h-3.5" />
              </div>
              <p className="font-serif text-lg text-white tabular-nums leading-tight mt-0.5">
                {formatBRL(kitTotal)}
              </p>
            </button>

            <button
              type="button"
              disabled={!canFinishKit}
              onClick={() => handleConfirmKit(false)}
              className="h-10 px-4 bg-brand-gold text-[#0A0A0A] disabled:opacity-40 text-[10px] font-semibold uppercase tracking-[0.14em] shrink-0 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{canFinishKit ? 'Fechar Kit' : `Faltam ${Math.max(0, settings.minItems - kitCount)}`}</span>
            </button>
          </div>
        </div>

        {/* Gaveta Mobile de Revisão do Kit */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative bg-[#0A0A0A] text-white border-t border-brand-gold p-5 max-h-[80vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                  Seu Kit EVORAH ({kitCount}/{settings.maxItems})
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 text-white/70 hover:text-white"
                  aria-label="Fechar resumo do kit"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedSlots.length === 0 ? (
                <p className="text-xs text-[#A3A7AE] py-4 text-center">
                  Nenhuma peça adicionada ainda. Escolha de {settings.minItems} a {settings.maxItems} joias.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedSlots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className="p-2.5 bg-white/[0.04] border border-white/15 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{slot.product.name}</p>
                        <p className="text-[11px] text-[#A3A7AE]">
                          {FINISH_DETAILS[slot.finish]?.short || slot.finish}
                          {slot.size ? ` • ${slot.size}` : ''} • {formatBRL(slot.unitPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.slotId)}
                        className="p-1.5 text-white/60 hover:text-white"
                        aria-label="Remover peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-white/15 space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-[#A3A7AE]">
                  <span>Subtotal</span>
                  <span>{formatBRL(kitSubtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-[#6EE7B7]">
                    <span>Desconto Kit ({discountPercent}%)</span>
                    <span>- {formatBRL(discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base text-brand-gold pt-2 border-t border-white/15">
                  <span>Total</span>
                  <span>{formatBRL(kitTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canFinishKit}
                onClick={() => handleConfirmKit(false)}
                className="w-full h-11 bg-brand-gold text-[#0A0A0A] disabled:opacity-40 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                {canFinishKit
                  ? 'Adicionar Kit à Sacola'
                  : `Escolha ao menos ${settings.minItems} peças`}
              </button>
            </div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
