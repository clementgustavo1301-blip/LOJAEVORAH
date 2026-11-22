'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { Rating } from '@/components/ui/rating';
import { Heart, Plus, ShieldCheck, Truck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  className = '',
  priority = false,
}: ProductCardProps) {
  const { addToCart, isWishlisted, toggleWishlist } = useCart();

  const isFavorite = isWishlisted(product.id);
  const currentPrice = product.promotionalPrice || product.price;
  const originalPrice =
    product.promotionalPrice && product.promotionalPrice < product.price
      ? product.price
      : null;

  const discountPercent = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null;

  const ratingValue =
    Number.isFinite(product.rating) && product.rating > 0 ? product.rating : 5.0;
  const reviewsCount =
    typeof product.reviewsCount === 'number' && product.reviewsCount > 0
      ? product.reviewsCount
      : undefined;

  const installments = 6;
  const installmentValue = (currentPrice / installments)
    .toFixed(2)
    .replace('.', ',');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      product,
      product.availableFinishes[0] || 'silver',
      product.availableSizes[0] || undefined,
      1
    );
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const primaryImage = product.images[0] || '/images/chain-grumet.webp';
  const secondaryImage = product.images[1];

  return (
    <article
      className={`group relative flex flex-col h-full bg-white border border-brand-border hover:border-brand-text/40 transition-colors duration-300 ${className}`}
    >
      {/* Frame Editorial 4:5 */}
      <div className="relative w-full aspect-[4/5] bg-white border-b border-brand-border overflow-hidden flex items-center justify-center">
        {/* Único Badge Discreto (Desconto ou Novo) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          {discountPercent !== null ? (
            <span className="inline-block px-2.5 py-1 bg-[#0A0A0A] text-white text-[10px] font-medium uppercase tracking-[0.14em] tabular-nums">
              -{discountPercent}%
            </span>
          ) : product.isNew ? (
            <span className="inline-block px-2.5 py-1 bg-white/95 text-brand-text border border-brand-border text-[10px] font-medium uppercase tracking-[0.14em]">
              Novo
            </span>
          ) : null}
        </div>

        {/* Botão Favoritar Minimalista */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/85 backdrop-blur-xs border border-transparent hover:border-brand-border text-brand-textMuted hover:text-brand-text transition-all flex items-center justify-center"
        >
          <Heart
            className={`w-3.5 h-3.5 stroke-[1.5] transition-transform active:scale-95 ${
              isFavorite ? 'fill-brand-text text-brand-text' : ''
            }`}
          />
        </button>

        {/* Link e Fotografia da Joia (troca de ângulo 100% em CSS GPU sem re-render React) */}
        <Link
          href={`/produto/${product.slug}`}
          prefetch={true}
          className="relative w-full h-full flex items-center justify-center p-3 sm:p-4"
        >
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-contain object-center p-2 transition-all duration-500 ease-out group-hover:scale-[1.04] ${
              secondaryImage ? 'group-hover:opacity-0' : ''
            }`}
          />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              aria-hidden="true"
              className="object-contain object-center p-2 opacity-0 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500 ease-out"
            />
          )}
        </Link>

        {/* Barra de Adição Rápida (sempre visível para toque no mobile; aparece no hover no desktop) */}
        <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3 z-10 opacity-100 translate-y-0 sm:opacity-0 sm:translate-y-1.5 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-200">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-full h-8 sm:h-9 bg-[#0A0A0A]/92 text-white hover:bg-brand-gold hover:text-[#0A0A0A] active:bg-brand-gold active:text-[#0A0A0A] active:scale-[0.98] flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Grupos de Informação (8px interno | 24px entre grupos) */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1 gap-6 text-left">
        {/* Grupo 1: Material, Título e Avaliação */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-brand-textMuted line-clamp-1">
            {product.material || 'Aço 316L & Prata 925'}
          </span>

          <Link
            href={`/produto/${product.slug}`}
            prefetch={true}
            className="group-hover:text-brand-gold transition-colors block max-w-full"
          >
            <h3 className="text-sm font-medium text-brand-text line-clamp-2 min-h-[2.45rem] leading-snug">
              {product.name}
            </h3>
          </Link>

          <Rating
            rating={ratingValue}
            reviewsCount={reviewsCount}
            size="sm"
          />
        </div>

        {/* Grupo 2: Preço, Parcelamento e Frete */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
            <span className="text-sm sm:text-base font-semibold text-brand-text">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </span>
            {originalPrice && (
              <span className="text-xs text-brand-textMuted/70 line-through">
                R$ {originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <p className="text-[11px] text-brand-textMuted tabular-nums leading-snug">
            {installments}x de R$ {installmentValue} sem juros
          </p>

          <div className="flex items-start gap-1.5 text-[11px] font-medium text-brand-text leading-snug">
            <Truck className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.6} />
            <span>
              Frete grátis{' '}
              <span className="text-brand-textMuted font-normal tabular-nums">
                (R$ 0,00)
              </span>
            </span>
          </div>
        </div>

        {/* Grupo 3: Pergunta & Garantia Vitalícia */}
        <div className="mt-auto bg-brand-background border border-brand-border p-2.5 sm:p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-text leading-snug">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" strokeWidth={1.6} />
            <span>Fica preto?</span>
          </div>
          <p className="text-[11px] text-brand-textMuted leading-snug">
            Não. Garantia vitalícia contra oxidação.
          </p>
        </div>
      </div>
    </article>
  );
});
