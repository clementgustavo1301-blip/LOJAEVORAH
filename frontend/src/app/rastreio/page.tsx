'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchOrderByTrackingOrNumber, updateStoredOrderPaymentStatus } from '@/lib/api';
import { Order } from '@/types';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  QrCode,
} from 'lucide-react';

function RastreioQuerySync({ onInitialQuery }: { onInitialQuery: (q: string) => void }) {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get('codigo') || searchParams.get('pedido') || '';

  useEffect(() => {
    if (initialQuery) {
      onInitialQuery(initialQuery);
    }
  }, [initialQuery, onInitialQuery]);

  return null;
}

export default function RastreioPage() {
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    try {
      const result = await fetchOrderByTrackingOrNumber(searchQuery);
      setOrder(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!order?.orderNumber || order.paymentStatus !== 'PENDING') return;
    const orderNum = order.orderNumber;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderNum)}/status`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.found && data.paymentStatus && data.paymentStatus !== 'PENDING') {
          setOrder((prev) =>
            prev ? { ...prev, paymentStatus: data.paymentStatus, paymentId: data.paymentId || prev.paymentId } : prev
          );
          updateStoredOrderPaymentStatus(orderNum, data.paymentStatus, data.paymentId);
        }
      } catch {
        // Ignore transient poll errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [order?.orderNumber, order?.paymentStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getProgressStage = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 4;
      case 'SHIPPED':
        return 3;
      case 'ORDERED_SUPPLIER':
        return 2;
      case 'PENDING_SUPPLIER':
      default:
        return 1;
    }
  };

  const currentStage = order ? getProgressStage(order.fulfillmentStatus) : 1;

  return (
    <div className="w-full bg-brand-background py-14 sm:py-20 px-6 sm:px-10 lg:px-12 flex-1">
      <Suspense fallback={null}>
        <RastreioQuerySync onInitialQuery={handleSearch} />
      </Suspense>
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho Editorial */}
        <div className="text-center mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-1.5">
            Concierge EVORAH
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-text font-normal tracking-tight">
            Rastrear Pedido
          </h1>
          <p className="text-xs text-brand-textMuted mt-2 max-w-md mx-auto leading-relaxed">
            Informe o número do pedido (ex.: INX-...) ou o código de rastreamento enviado após o despacho.
          </p>
        </div>

        {/* Campo de Busca */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative max-w-xl mx-auto mb-12"
        >
          <label htmlFor="tracking-search-input" className="sr-only">
            Número do pedido ou código de rastreamento
          </label>
          <div className="relative flex items-center">
            <input
              id="tracking-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Número do pedido ou código de rastreio..."
              className="w-full h-12 bg-white border border-brand-border pl-4 pr-36 text-xs text-brand-text placeholder:text-brand-textMuted focus:border-brand-text outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 h-9 px-5 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Buscando...</span>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Consultar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Não Encontrado */}
        {searched && !loading && !order && (
          <div className="bg-white border border-brand-border p-10 text-center max-w-lg mx-auto">
            <AlertCircle className="w-6 h-6 text-brand-gold mx-auto mb-3 stroke-[1.5]" />
            <h3 className="font-serif text-xl font-normal text-brand-text">
              Pedido não localizado
            </h3>
            <p className="text-xs text-brand-textMuted mt-1.5 max-w-sm mx-auto leading-relaxed">
              Verifique se o número do pedido ou o código de rastreamento foi informado exatamente como consta na confirmação.
            </p>
          </div>
        )}

        {/* Encontrado */}
        {order && (
          <div className="bg-white border border-brand-border overflow-hidden">
            {/* Top Bar do Pedido */}
            <div className="bg-[#0A0A0A] text-white p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-brand-gold block font-semibold">
                  Pedido EVORAH
                </span>
                <div className="flex flex-wrap items-center gap-2.5 mt-1">
                  <h2 className="font-mono text-base font-semibold text-white tracking-wide tabular-nums">
                    {order.orderNumber}
                  </h2>
                  {order.paymentStatus === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Pagamento aprovado • {order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'PIX'}
                    </span>
                  ) : order.paymentStatus === 'CANCELLED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                      <AlertCircle className="w-3 h-3" />
                      Pagamento cancelado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {order.paymentMethod === 'CREDIT_CARD' ? (
                        <CreditCard className="w-3 h-3" />
                      ) : (
                        <QrCode className="w-3 h-3" />
                      )}
                      Aguardando confirmação • {order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'PIX'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.orderNumber)}
                    className="p-1 text-white/60 hover:text-brand-gold transition-colors"
                    title="Copiar número do pedido"
                    aria-label="Copiar número do pedido"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-brand-gold" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/50 block font-medium">
                  Emissão
                </span>
                <span className="text-xs text-white/90 tabular-nums mt-1 block">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Linha do Tempo */}
            <div className="p-7 border-b border-brand-border">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-7">
                Progresso da Entrega
              </h3>

              <div className="relative">
                <div className="absolute top-4 left-6 right-6 h-[1px] bg-brand-border -z-0">
                  <div
                    className="h-full bg-brand-gold transition-all duration-500"
                    style={{
                      width: `${((currentStage - 1) / 3) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs transition-colors border ${
                        currentStage >= 1
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                          : 'bg-white border-brand-border text-brand-textMuted'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-medium text-brand-text mt-2.5">
                      {order.paymentStatus === 'PAID'
                        ? 'Pagamento Confirmado'
                        : order.paymentStatus === 'CANCELLED'
                          ? 'Pagamento Cancelado'
                          : 'Aguardando Pagamento'}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs transition-colors border ${
                        currentStage >= 2
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                          : 'bg-white border-brand-border text-brand-textMuted'
                      }`}
                    >
                      <Package className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-medium text-brand-text mt-2.5">
                      Preparação
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs transition-colors border ${
                        currentStage >= 3
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                          : 'bg-white border-brand-border text-brand-textMuted'
                      }`}
                    >
                      <Truck className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-medium text-brand-text mt-2.5">
                      Em Trânsito
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs transition-colors border ${
                        currentStage >= 4
                          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                          : 'bg-white border-brand-border text-brand-textMuted'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <span className="text-[11px] font-medium text-brand-text mt-2.5">
                      Entregue
                    </span>
                  </div>
                </div>
              </div>

              {/* Código de Rastreamento */}
              {order.trackingCode ? (
                <div className="mt-8 p-5 bg-brand-background border border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-brand-textMuted block">
                      Código de Rastreamento ({order.trackingCarrier || 'Correios'})
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm font-semibold text-brand-text">
                        {order.trackingCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.trackingCode!)}
                        className="p-1 text-brand-textMuted hover:text-brand-text transition-colors"
                        title="Copiar código"
                        aria-label="Copiar código de rastreamento"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-brand-gold" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <a
                    href={
                      order.trackingCarrier?.toLowerCase().includes('shopee') ||
                      order.trackingCarrier?.toLowerCase().includes('spx')
                        ? `https://spx.com.br/`
                        : order.trackingCarrier?.toLowerCase().includes('j&t')
                        ? `https://www.jtexpress.com.br/`
                        : `https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-5 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors shrink-0"
                  >
                    <span>Acompanhar na transportadora</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                  </a>
                </div>
              ) : (
                <div className="mt-8 p-5 bg-brand-background border border-brand-border flex items-start gap-3.5">
                  <Clock className="w-4 h-4 text-brand-gold shrink-0 mt-0.5 stroke-[1.5]" />
                  <div>
                    <h4 className="text-xs font-semibold text-brand-text uppercase tracking-[0.14em]">
                      Emissão de etiqueta em andamento
                    </h4>
                    <p className="text-xs text-brand-textMuted mt-1 leading-relaxed">
                      Sua peça está passando pela conferência de qualidade. Assim que despachada, o código de rastreamento será exibido aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Itens do Pedido */}
            <div className="p-7">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-textMuted mb-4">
                Peças do Pedido
              </h3>

              <div className="divide-y divide-brand-border">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="py-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-brand-text">
                          {it.productName}
                        </span>
                        <div className="text-brand-textMuted text-[11px] mt-0.5 flex items-center gap-2">
                          <span>Acabamento: {it.finish}</span>
                          {it.size && <span>• Tam: {it.size}</span>}
                          <span>• Qtd: {it.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-brand-text tabular-nums">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(it.unitPrice * it.quantity)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-xs text-brand-textMuted">
                    Itens do pedido
                  </div>
                )}
              </div>

              {/* Endereço */}
              <div className="mt-6 pt-6 border-t border-brand-border grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-textMuted block mb-1.5">
                    Destinatário
                  </span>
                  <span className="font-medium text-brand-text block">
                    {order.customerName}
                  </span>
                  <span className="text-brand-textMuted block">
                    {order.customerEmail}
                  </span>
                  <span className="text-brand-textMuted block">
                    {order.customerPhone}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-textMuted block mb-1.5">
                    Endereço de Entrega
                  </span>
                  <span className="text-brand-text block">
                    {order.shippingAddress.street},{' '}
                    {order.shippingAddress.number}
                    {order.shippingAddress.complement
                      ? ` - ${order.shippingAddress.complement}`
                      : ''}
                  </span>
                  <span className="text-brand-text block">
                    {order.shippingAddress.neighborhood} -{' '}
                    {order.shippingAddress.city}/{order.shippingAddress.state}
                  </span>
                  <span className="text-brand-textMuted block tabular-nums">
                    CEP: {order.shippingAddress.cep}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
