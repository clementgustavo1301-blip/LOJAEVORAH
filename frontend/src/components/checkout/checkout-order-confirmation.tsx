'use client';

import React from 'react';
import Link from 'next/link';
import { MotionConfig, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { OrderPaymentStatus } from '@/types';

export interface ConfirmedOrderItemSnapshot {
  id: string;
  name: string;
  finish: string;
  size?: string;
  quantity: number;
  unitPrice: number;
}

export interface ConfirmedOrderState {
  id: string;
  orderNumber: string;
  paymentId?: string;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  customerName?: string;
  customerEmail: string;
  shippingAddressLine?: string;
  total: number;
  subtotal?: number;
  discount?: number;
  pixDiscount?: number;
  shippingFee?: number;
  items?: ConfirmedOrderItemSnapshot[];
  pixCode?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
  simulated?: boolean;
}

interface CheckoutOrderConfirmationProps {
  orderConfirmed: ConfirmedOrderState;
  copiedPix: boolean;
  onCopyPix: () => void;
  checkingPayment: boolean;
  onCheckPayment: () => void;
  simulatingWebhook: boolean;
  onSimulateWebhook: () => void;
}

function formatBRL(value: number): string {
  return Number(value || 0).toFixed(2).replace('.', ',');
}

export function CheckoutOrderConfirmation({
  orderConfirmed,
  copiedPix,
  onCopyPix,
  checkingPayment,
  onCheckPayment,
  simulatingWebhook,
  onSimulateWebhook,
}: CheckoutOrderConfirmationProps) {
  const isPaid = orderConfirmed.paymentStatus === 'PAID';
  const isCancelled = orderConfirmed.paymentStatus === 'CANCELLED';
  const isPendingPix =
    orderConfirmed.paymentMethod === 'PIX' && orderConfirmed.paymentStatus === 'PENDING';

  const topBarClass = isPaid
    ? 'bg-emerald-700'
    : isCancelled
      ? 'bg-[#9F2F2D]'
      : 'bg-brand-gold';

  const methodBadge =
    orderConfirmed.paymentMethod === 'PIX' ? 'PIX • 5% OFF' : 'CARTÃO DE CRÉDITO';

  const outerLayoutClass = isPendingPix
    ? 'max-w-2xl mx-auto space-y-6'
    : 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start';

  const mainSectionColClass = isPendingPix ? '' : 'lg:col-span-7';
  const asideColClass = isPendingPix ? '' : 'lg:col-span-5';

  return (
    <MotionConfig reducedMotion="user">
      <div className={outerLayoutClass}>
        {/* Main Editorial Pedestal: Payment Status & PIX */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`${mainSectionColClass} bg-white border border-brand-border relative`.trim()}
          aria-labelledby="checkout-order-heading"
        >
          <div className={`h-[3px] w-full ${topBarClass}`} />

          {/* Header strip: status + order code + anchor total */}
          <div className={isPendingPix ? 'p-4 sm:px-7 sm:py-4 border-b border-brand-border' : 'p-6 sm:p-8 border-b border-brand-border'}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {isPaid ? (
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" strokeWidth={1.75} />
                  <span>Pagamento confirmado</span>
                </div>
              ) : isCancelled ? (
                <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9F2F2D]">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Pagamento cancelado</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-text">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-brand-gold opacity-75" />
                    <span className="relative inline-flex h-2 w-2 bg-brand-gold" />
                  </span>
                  <span>
                    {orderConfirmed.paymentMethod === 'PIX'
                      ? 'Aguardando pagamento PIX'
                      : 'Em análise — aguardando confirmação'}
                  </span>
                </div>
              )}

              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted">
                {methodBadge}
              </span>
            </div>

            <div
              className={
                isPendingPix
                  ? 'mt-3 flex items-end justify-between gap-3'
                  : 'mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4'
              }
            >
              <div className="space-y-1 min-w-0">
                <h2
                  id="checkout-order-heading"
                  className={
                    isPendingPix
                      ? 'font-serif text-xl sm:text-2xl xl:text-[30px] font-medium tracking-tight text-brand-text leading-[1.1] [font-variant-numeric:lining-nums_tabular-nums]'
                      : 'font-serif text-2xl sm:text-3xl xl:text-[34px] font-medium tracking-tight text-brand-text leading-[1.1] [font-variant-numeric:lining-nums_tabular-nums]'
                  }
                >
                  Pedido{' '}
                  <span className="whitespace-nowrap">#{orderConfirmed.orderNumber}</span>
                </h2>
                <p className="text-xs text-brand-textMuted leading-relaxed truncate">
                  {orderConfirmed.customerEmail}
                </p>
              </div>

              <div
                className={
                  isPendingPix
                    ? 'text-right shrink-0 border-l border-brand-border pl-3 sm:pl-6'
                    : 'sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-brand-border pt-3 sm:pt-0 sm:pl-6'
                }
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted">
                  {isPaid ? 'Total pago' : 'Valor via PIX'}
                </span>
                <span
                  className={
                    isPendingPix
                      ? 'block font-serif text-2xl sm:text-3xl font-medium text-brand-text [font-variant-numeric:lining-nums_tabular-nums] leading-none mt-1 whitespace-nowrap'
                      : 'block font-serif text-3xl font-medium text-brand-text [font-variant-numeric:lining-nums_tabular-nums] leading-none mt-1 whitespace-nowrap'
                  }
                >
                  R$ {formatBRL(orderConfirmed.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Body */}
          <div className={isPendingPix ? 'p-4 sm:p-6 space-y-5' : 'p-6 sm:p-8 space-y-6'}>
            {isPaid && (
              <div className="p-5 sm:p-6 bg-brand-background border border-brand-border border-l-2 border-l-emerald-700 flex items-start gap-4">
                <div className="w-9 h-9 bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-brand-text">
                    {orderConfirmed.paymentMethod === 'PIX'
                      ? 'PIX recebido e aprovado.'
                      : 'Pagamento aprovado no cartão.'}
                  </p>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    Total confirmado de R$ {formatBRL(orderConfirmed.total)}. Suas peças entraram
                    em separação e conferência no ateliê EVORAH.
                  </p>
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="p-5 sm:p-6 bg-brand-background border border-brand-border border-l-2 border-l-[#9F2F2D] flex items-start gap-4">
                <AlertCircle
                  className="w-5 h-5 text-[#9F2F2D] shrink-0 mt-0.5"
                  strokeWidth={1.75}
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-brand-text">
                    O pagamento não foi concluído.
                  </p>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    Caso deseje tentar novamente com outro método, retorne aos produtos para gerar
                    um novo pedido.
                  </p>
                </div>
              </div>
            )}

            {isPendingPix && (
              <>
                {/* Centered QR Code Hero Pedestal */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="max-w-md space-y-1">
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold">
                      Pagamento instantâneo
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-medium text-brand-text leading-tight">
                      Escaneie o QR Code para pagar
                    </h3>
                  </div>

                  <div className="w-48 h-48 sm:w-52 sm:h-52 mx-auto bg-brand-background border border-brand-border p-3 relative flex items-center justify-center shadow-[0_12px_32px_-16px_rgba(10,10,10,0.14)]">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-brand-gold"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-brand-gold"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-brand-gold"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-brand-gold"
                    />

                    <div className="w-full h-full bg-white p-2 flex items-center justify-center overflow-hidden">
                      {orderConfirmed.pixQrCodeBase64 ? (
                        <img
                          src={`data:image/png;base64,${orderConfirmed.pixQrCodeBase64}`}
                          alt="QR Code PIX para pagamento do pedido"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full border-2 border-[#0A0A0A] p-2 grid grid-cols-4 gap-1">
                          <div className="bg-[#0A0A0A]" /><div className="bg-white" /><div className="bg-[#0A0A0A]" /><div className="bg-[#0A0A0A]" />
                          <div className="bg-white" /><div className="bg-[#0A0A0A]" /><div className="bg-white" /><div className="bg-[#0A0A0A]" />
                          <div className="bg-[#0A0A0A]" /><div className="bg-[#0A0A0A]" /><div className="bg-[#0A0A0A]" /><div className="bg-white" />
                          <div className="bg-[#0A0A0A]" /><div className="bg-white" /><div className="bg-[#0A0A0A]" /><div className="bg-[#0A0A0A]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full-Width Copia e Cola Bar */}
                <div className="pt-5 border-t border-brand-border space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="pix-copy-code"
                      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text"
                    >
                      Código PIX Copia e Cola
                    </label>
                    <span className="hidden sm:inline text-[11px] text-brand-textMuted">
                      Toque no botão para copiar
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row border border-brand-border bg-brand-background focus-within:border-brand-text transition-colors">
                    <input
                      id="pix-copy-code"
                      type="text"
                      readOnly
                      onFocus={(e) => e.currentTarget.select()}
                      value={orderConfirmed.pixCode || ''}
                      aria-label="Código PIX Copia e Cola"
                      className="w-full sm:w-auto sm:min-w-0 sm:flex-1 shrink-0 h-11 sm:h-12 px-4 bg-transparent font-mono text-xs text-brand-text focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={onCopyPix}
                      className={`h-11 sm:h-12 px-6 font-semibold text-[11px] uppercase tracking-[0.16em] flex items-center justify-center gap-2 shrink-0 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-text ${
                        copiedPix
                          ? 'bg-emerald-800 text-white'
                          : 'bg-brand-text text-white hover:bg-brand-accent'
                      }`}
                    >
                      {copiedPix ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      ) : (
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      <span>{copiedPix ? 'Copiado' : 'Copiar código PIX'}</span>
                    </button>
                  </div>
                </div>

                {/* 3-Step Payment Guide */}
                <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-brand-textMuted leading-relaxed">
                  {[
                    {
                      step: '01',
                      text: 'Abra o app do seu banco e acesse a área PIX.',
                    },
                    {
                      step: '02',
                      text: 'Escaneie o QR Code acima ou cole o código copiado.',
                    },
                    {
                      step: '03',
                      text: 'A confirmação aparece automaticamente nesta tela.',
                    },
                  ].map((item) => (
                    <li
                      key={item.step}
                      className="flex items-start gap-2.5 p-3 bg-brand-background/70 border border-brand-border"
                    >
                      <span className="font-mono text-[10px] font-semibold text-brand-text border border-brand-border bg-white px-1.5 py-0.5 tabular-nums shrink-0">
                        {item.step}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ol>

                {/* Sync & Manual Verify Strip */}
                <div className="pt-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-xs text-brand-textMuted">
                    <RefreshCw
                      className="w-3.5 h-3.5 text-brand-gold animate-spin"
                      strokeWidth={1.75}
                    />
                    <span>Atualização automática ativa após o pagamento</span>
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    {orderConfirmed.ticketUrl && (
                      <a
                        href={orderConfirmed.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text underline underline-offset-4 hover:text-brand-gold transition-colors"
                      >
                        <span>Abrir no Mercado Pago</span>
                        <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={onCheckPayment}
                      disabled={checkingPayment}
                      className="h-9 px-4 border border-brand-text bg-white hover:bg-brand-text hover:text-white text-brand-text font-semibold text-[11px] uppercase tracking-[0.14em] inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${checkingPayment ? 'animate-spin' : ''}`}
                        strokeWidth={1.75}
                      />
                      <span>{checkingPayment ? 'Verificando...' : 'Já paguei • Verificar agora'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Local Sandbox Simulation Helper */}
            {orderConfirmed.paymentStatus === 'PENDING' && orderConfirmed.simulated && (
              <div className="p-4 border border-dashed border-brand-border bg-brand-background/70 space-y-2.5">
                <p className="text-[11px] text-brand-textMuted leading-relaxed">
                  Modo sandbox local ativo (sem credenciais Mercado Pago): simule o retorno
                  automático do webhook abaixo.
                </p>
                <button
                  type="button"
                  onClick={onSimulateWebhook}
                  disabled={simulatingWebhook}
                  className="w-full h-10 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] tracking-[0.14em] uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                  <span>
                    {simulatingWebhook
                      ? 'Confirmando via Webhook...'
                      : orderConfirmed.paymentMethod === 'PIX'
                        ? 'Simular pagamento PIX aprovado (Webhook)'
                        : 'Simular pagamento aprovado (Webhook)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </motion.section>

        {/* Right / Bottom Asymmetric Obsidian Receipt Ledger */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`${asideColClass} bg-[#0A0A0A] text-[#FAF9F6] border border-[#0A0A0A] p-6 sm:p-7 space-y-5`.trim()}
          aria-label="Comprovante do pedido"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/15">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold">
              Resumo do pedido
            </span>
            <span className="font-mono text-xs text-[#A3A7AE] tabular-nums">
              #{orderConfirmed.orderNumber}
            </span>
          </div>

          {orderConfirmed.items && orderConfirmed.items.length > 0 && (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-white/10">
              {orderConfirmed.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-3 text-xs ${
                    idx > 0 ? 'pt-3' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-[#A3A7AE] mt-0.5">
                      Qtd: {item.quantity} • {item.finish}
                      {item.size ? ` • ${item.size}` : ''}
                    </p>
                  </div>
                  <span className="text-[#FAF9F6] font-semibold tabular-nums shrink-0">
                    R$ {formatBRL(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {orderConfirmed.shippingAddressLine && (
            <div className="pt-4 border-t border-white/15 flex items-start gap-2.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="space-y-0.5 text-[#A3A7AE] leading-relaxed">
                {orderConfirmed.customerName && (
                  <p className="text-white font-medium">{orderConfirmed.customerName}</p>
                )}
                <p>{orderConfirmed.shippingAddressLine}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/15 space-y-2 text-xs tabular-nums text-[#A3A7AE]">
            {typeof orderConfirmed.subtotal === 'number' && (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#FAF9F6]">R$ {formatBRL(orderConfirmed.subtotal)}</span>
              </div>
            )}
            {typeof orderConfirmed.discount === 'number' && orderConfirmed.discount > 0 && (
              <div className="flex justify-between text-[#6EE7B7]">
                <span>Cupom aplicado</span>
                <span>- R$ {formatBRL(orderConfirmed.discount)}</span>
              </div>
            )}
            {typeof orderConfirmed.pixDiscount === 'number' && orderConfirmed.pixDiscount > 0 && (
              <div className="flex justify-between text-[#6EE7B7]">
                <span>Desconto PIX (5%)</span>
                <span>- R$ {formatBRL(orderConfirmed.pixDiscount)}</span>
              </div>
            )}
            {typeof orderConfirmed.shippingFee === 'number' && (
              <div className="flex justify-between">
                <span>Frete</span>
                <span className="text-[#FAF9F6]">
                  {orderConfirmed.shippingFee === 0
                    ? 'Grátis'
                    : `R$ ${formatBRL(orderConfirmed.shippingFee)}`}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-white/15 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#A3A7AE]">Total</span>
              <span className="font-serif text-2xl font-medium text-brand-gold [font-variant-numeric:lining-nums_tabular-nums]">
                R$ {formatBRL(orderConfirmed.total)}
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            {isPaid && (
              <Link
                href={`/rastreio?pedido=${orderConfirmed.orderNumber}`}
                className="h-11 w-full bg-brand-gold text-[#0A0A0A] hover:bg-[#DFC383] font-semibold text-[11px] tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <span>Acompanhar pedido</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            )}
            <Link
              href="/produtos"
              className="h-11 w-full border border-white/25 text-[#FAF9F6] hover:border-brand-gold hover:text-brand-gold font-semibold text-[11px] tracking-[0.16em] uppercase flex items-center justify-center transition-colors"
            >
              Continuar comprando
            </Link>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#A3A7AE]">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" strokeWidth={1.75} />
            <span>Pagamento protegido • Mercado Pago</span>
          </div>
        </motion.aside>
      </div>
    </MotionConfig>
  );
}
