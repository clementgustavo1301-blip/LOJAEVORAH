'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { X, Trash2, ArrowRight, Check } from 'lucide-react';
import { FINISH_DETAILS } from '@/components/ui/swatch-selector';

export function MiniCartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    kitDiscountPercent,
    kitDiscount,
    couponDiscount,
    discount,
    shippingFee,
    total,
    installmentsText,
    coupon,
    applyCoupon,
    removeCoupon,
    isMiniCartOpen,
    setIsMiniCartOpen,
    totalCount,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isMiniCartOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback(res);
  };

  const freeShippingProgress = 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar sacola"
        className="absolute inset-0 w-full h-full bg-black/45 backdrop-blur-xs transition-opacity cursor-default"
        onClick={() => setIsMiniCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-brand-border shadow-luxury flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-brand-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
                  Sacola
                </span>
                <span className="text-[11px] text-brand-textMuted bg-brand-background px-2.5 py-0.5 border border-brand-border tabular-nums">
                  {totalCount} {totalCount === 1 ? 'peça' : 'peças'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMiniCartOpen(false)}
                className="text-brand-textMuted hover:text-brand-text p-1.5 transition-colors"
                aria-label="Fechar sacola"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </div>

            {/* Faixa de Frete Grátis */}
            <div className="mt-5 pt-4 border-t border-brand-border">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-brand-text font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand-gold" /> Frete grátis em todas as compras
                </span>
                <span className="text-brand-textMuted text-[11px] tabular-nums">
                  {freeShippingProgress}%
                </span>
              </div>
              <div className="w-full h-[2px] bg-brand-background overflow-hidden">
                <div
                  className="h-full bg-brand-gold transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-brand-background">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <h4 className="font-serif text-xl font-normal text-brand-text mb-1.5">
                  Sua sacola está vazia
                </h4>
                <p className="text-xs text-brand-textMuted max-w-[230px] mb-6 leading-relaxed">
                  Explore o acervo EVORAH e selecione suas peças.
                </p>
                <button
                  type="button"
                  onClick={() => setIsMiniCartOpen(false)}
                  className="h-11 px-6 bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors"
                >
                  Explorar coleção
                </button>
              </div>
            ) : (
              items.map((item) => {
                const finishInfo =
                  FINISH_DETAILS[item.finish] || FINISH_DETAILS.silver;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-white border border-brand-border relative"
                  >
                    {/* Imagem */}
                    <div className="relative w-16 h-20 bg-brand-background border border-brand-border shrink-0 overflow-hidden">
                      <Image
                        src={item.product.images[0] || '/images/chain-grumet.webp'}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>

                    {/* Detalhes */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {item.kitId && (
                          <span className="inline-block mb-1 px-1.5 py-0.5 bg-[#0A0A0A] text-brand-gold text-[9px] font-semibold uppercase tracking-[0.14em]">
                            Kit EVORAH
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-medium text-brand-text line-clamp-1">
                            {item.product.name}
                          </h5>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-brand-textMuted hover:text-brand-text p-0.5 transition-colors shrink-0"
                            title="Remover item"
                            aria-label="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-textMuted">
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${finishInfo.background} border border-black/20`}
                            />
                            {finishInfo.short}
                          </span>
                          {item.size && (
                            <>
                              <span className="text-brand-border">•</span>
                              <span>Tam: {item.size}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Seletor de Quantidade */}
                        <div className="flex items-center bg-brand-background border border-brand-border h-7 px-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-6 h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text text-xs"
                            aria-label="Diminuir quantidade"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs text-brand-text font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-6 h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text text-xs"
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        {/* Preço */}
                        <span className="text-sm font-semibold text-brand-text tabular-nums">
                          R${' '}
                          {(item.price * item.quantity)
                            .toFixed(2)
                            .replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé da Sacola */}
          {items.length > 0 && (
            <div className="p-6 border-t border-brand-border bg-white space-y-4">
              {/* Cupom */}
              <div>
                {coupon ? (
                  <div className="flex items-center justify-between bg-brand-background px-3.5 py-2.5 border border-brand-border text-xs">
                    <span className="text-brand-text font-medium">
                      Cupom &quot;{coupon}&quot; aplicado
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-brand-textMuted hover:text-brand-text underline text-xs"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex gap-2">
                    <label htmlFor="minicart-coupon" className="sr-only">
                      Cupom de desconto
                    </label>
                    <input
                      id="minicart-coupon"
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      placeholder="Código promocional"
                      className="flex-1 h-10 px-3.5 bg-brand-background border border-brand-border text-xs text-brand-text placeholder:text-brand-textMuted uppercase focus:border-brand-text focus:bg-white outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 bg-white border border-brand-border hover:border-brand-text text-[11px] text-brand-text font-semibold uppercase tracking-[0.14em] transition-colors"
                    >
                      Aplicar
                    </button>
                  </form>
                )}
                {couponFeedback && !coupon && (
                  <p
                    className={`text-xs mt-1.5 ${
                      couponFeedback.success
                        ? 'text-brand-text'
                        : 'text-red-700'
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Totais */}
              <div className="space-y-2 text-xs bg-brand-background p-4 border border-brand-border tabular-nums">
                <div className="flex justify-between text-brand-textMuted">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {kitDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Desconto Kit ({kitDiscountPercent}%)</span>
                    <span>- R$ {kitDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-brand-text font-medium">
                    <span>Cupom</span>
                    <span>- R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {discount > 0 && kitDiscount === 0 && couponDiscount === 0 && (
                  <div className="flex justify-between text-brand-text font-medium">
                    <span>Desconto</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-textMuted">
                  <span>Entrega</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-brand-text font-medium">
                        Grátis
                      </span>
                    ) : (
                      `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-brand-text text-sm font-semibold pt-2.5 border-t border-brand-border">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-[11px] text-brand-textMuted text-right">
                  {installmentsText}
                </p>
              </div>

              {/* Ação */}
              <Link
                href="/checkout"
                onClick={() => setIsMiniCartOpen(false)}
                className="w-full h-12 bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A] flex items-center justify-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors"
              >
                <span>Finalizar compra</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
