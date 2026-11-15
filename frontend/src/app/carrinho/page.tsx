'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { Trash2, ArrowRight } from 'lucide-react';
import { FINISH_DETAILS } from '@/components/ui/swatch-selector';
import { TrustSeals } from '@/components/ui/trust-seals';

export default function CartPage() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    discount,
    shippingFee,
    total,
    installmentsText,
    coupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponFeedback(res);
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-brand-background min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-2xl font-serif font-normal text-brand-text mb-2">
          Sua sacola está vazia
        </h1>
        <p className="text-xs text-brand-textMuted max-w-xs mb-6 leading-relaxed">
          Explore o acervo EVORAH e adicione suas peças preferidas.
        </p>
        <Link
          href="/produtos"
          className="h-11 px-7 bg-[#0A0A0A] text-white font-semibold text-[11px] tracking-[0.16em] uppercase hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors flex items-center justify-center"
        >
          Explorar acervo
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-background min-h-screen py-12 sm:py-16 px-6 sm:px-10 lg:px-12">
      <div className="max-w-[1240px] mx-auto">
        <div className="pb-6 border-b border-brand-border mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-1.5">
            Revisão de Pedido
          </span>
          <h1 className="text-3xl font-serif font-normal text-brand-text tracking-tight">
            Sacola de Compras
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Lista de Itens */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const finishInfo =
                FINISH_DETAILS[item.finish] || FINISH_DETAILS.silver;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-5 p-5 bg-white border border-brand-border items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <div className="relative w-16 h-20 bg-brand-background shrink-0 overflow-hidden border border-brand-border">
                      <Image
                        src={item.product.images[0] || '/images/chain-grumet.webp'}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-brand-text">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-brand-textMuted">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${finishInfo.background} border border-black/20`}
                          />
                          {finishInfo.label}
                        </span>
                        {item.size && <span>• Tam: {item.size}</span>}
                      </div>
                      <span className="text-sm font-semibold text-brand-text block mt-2 sm:hidden tabular-nums">
                        R${' '}
                        {(item.price * item.quantity)
                          .toFixed(2)
                          .replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-brand-border">
                    {/* Seletor de Quantidade */}
                    <div className="flex items-center border border-brand-border bg-white h-8">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-8 h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text transition-colors text-xs"
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs text-brand-text font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-8 h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text transition-colors text-xs"
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>

                    {/* Preço */}
                    <span className="hidden sm:inline text-sm font-semibold text-brand-text min-w-[90px] text-right tabular-nums">
                      R${' '}
                      {(item.price * item.quantity)
                        .toFixed(2)
                        .replace('.', ',')}
                    </span>

                    {/* Remover */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-brand-textMuted hover:text-brand-text p-1.5 transition-colors"
                      title="Remover"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-4 bg-white border border-brand-border p-7 space-y-6">
            <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-brand-text pb-3.5 border-b border-brand-border">
              Resumo do Pedido
            </h2>

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
                  <label htmlFor="cart-coupon-input" className="sr-only">
                    Código promocional
                  </label>
                  <input
                    id="cart-coupon-input"
                    type="text"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    placeholder="Código promocional"
                    className="flex-1 h-10 px-3 bg-brand-background border border-brand-border text-xs text-brand-text placeholder:text-brand-textMuted uppercase focus:border-brand-text outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 bg-white border border-brand-border hover:border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
                  >
                    Aplicar
                  </button>
                </form>
              )}
              {couponFeedback && !coupon && (
                <p
                  className={`text-xs mt-1.5 ${
                    couponFeedback.success ? 'text-brand-text' : 'text-red-700'
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Linhas de Valores */}
            <div className="space-y-2.5 text-xs tabular-nums">
              <div className="flex justify-between text-brand-textMuted">
                <span>Subtotal</span>
                <span className="text-brand-text">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-brand-text font-medium">
                  <span>Desconto</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-textMuted">
                <span>Frete</span>
                <span className="text-brand-text">
                  {shippingFee === 0
                    ? 'Grátis'
                    : `R$ ${shippingFee.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <div className="flex justify-between text-brand-text text-base font-semibold pt-3 border-t border-brand-border">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <p className="text-[11px] text-brand-textMuted text-right">
                {installmentsText}
              </p>
            </div>

            <Link
              href="/checkout"
              className="w-full h-12 bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A] flex items-center justify-center gap-2.5 font-semibold text-[11px] tracking-[0.18em] uppercase transition-colors"
            >
              <span>Finalizar compra</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>

            <TrustSeals variant="inline-compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
