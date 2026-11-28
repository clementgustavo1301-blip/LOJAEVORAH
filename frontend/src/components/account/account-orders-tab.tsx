'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Order, OrderPaymentStatus } from '@/types';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function getFulfillmentStage(status: Order['fulfillmentStatus']): {
  step: number;
  label: string;
} {
  switch (status) {
    case 'DELIVERED':
      return { step: 4, label: 'Entregue' };
    case 'SHIPPED':
      return { step: 3, label: 'Em trânsito' };
    case 'ORDERED_SUPPLIER':
      return { step: 2, label: 'Em preparação' };
    case 'PENDING_SUPPLIER':
    default:
      return { step: 1, label: 'Pedido recebido' };
  }
}

function getCarrierUrl(trackingCode: string, carrier?: string): string {
  const normalized = (carrier || '').toLowerCase();
  if (normalized.includes('shopee') || normalized.includes('spx')) {
    return 'https://spx.com.br/';
  }
  if (normalized.includes('j&t')) {
    return 'https://www.jtexpress.com.br/';
  }
  return `https://rastreamento.correios.com.br/app/index.php?codigo=${encodeURIComponent(trackingCode)}`;
}

export function AccountOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [emailVerified, setEmailVerified] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checkingOrderNumber, setCheckingOrderNumber] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account/orders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar pedidos.');
      }
      const list = Array.isArray(data.orders) ? (data.orders as Order[]) : [];
      setOrders(list);
      setEmailVerified(Boolean(data.emailVerified));
      if (list.length > 0) {
        setExpandedId((prev) => prev || list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const checkOrderPaymentStatus = useCallback(
    async (orderNumber: string, manual = false) => {
      if (manual) setCheckingOrderNumber(orderNumber);
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}/status`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.found && data.paymentStatus && data.paymentStatus !== 'PENDING') {
          const nextStatus = data.paymentStatus as OrderPaymentStatus;
          setOrders((prev) =>
            prev.map((o) =>
              o.orderNumber === orderNumber
                ? {
                    ...o,
                    paymentStatus: nextStatus,
                    pixCode: undefined,
                    pixQrCodeBase64: undefined,
                    pixTicketUrl: undefined,
                  }
                : o
            )
          );
        }
      } catch {
        // Ignora falhas temporárias de rede durante polling
      } finally {
        if (manual) setCheckingOrderNumber(null);
      }
    },
    []
  );

  // Verificação automática a cada 4s enquanto um pedido PIX pendente estiver aberto
  const expandedOrder = orders.find((o) => o.id === expandedId) || null;
  const expandedPendingPixNumber =
    expandedOrder &&
    expandedOrder.paymentMethod === 'PIX' &&
    expandedOrder.paymentStatus === 'PENDING'
      ? expandedOrder.orderNumber
      : null;

  useEffect(() => {
    if (!expandedPendingPixNumber) return;
    const interval = setInterval(() => {
      void checkOrderPaymentStatus(expandedPendingPixNumber, false);
    }, 4000);
    return () => clearInterval(interval);
  }, [expandedPendingPixNumber, checkOrderPaymentStatus]);

  const handleCopy = async (value: string, keyId: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Ignore clipboard failures
    }
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (loading) {
    return (
      <div className="bg-white border border-brand-border p-12 flex items-center justify-center gap-3 text-xs text-brand-textMuted">
        <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
        <span>Carregando seu histórico de compras...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            Histórico de Compras
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text mt-1">
            Meus Pedidos
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          className="h-9 px-3.5 border border-brand-border bg-white hover:border-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text inline-flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Atualizar</span>
        </button>
      </div>

      {!emailVerified && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Seu e-mail ainda não foi confirmado. Confirme o link enviado para sua caixa de entrada para importar automaticamente pedidos feitos antes da criação da conta.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white border border-brand-border p-10 sm:p-12 text-center space-y-4">
          <div className="w-11 h-11 bg-brand-background border border-brand-border flex items-center justify-center mx-auto text-brand-gold">
            <Package className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-serif text-xl text-brand-text">
              Você ainda não possui pedidos
            </h3>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Assim que realizar sua primeira compra na EVORAH, o comprovante, a chave PIX para pagamento pendente e o rastreio aparecerão aqui.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/produtos"
              className="h-11 px-7 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
            >
              <span>Explorar acervo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/rastreio"
              className="h-11 px-5 border border-brand-border hover:border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center transition-colors"
            >
              Rastrear por código
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const isPendingPix =
              order.paymentMethod === 'PIX' && order.paymentStatus === 'PENDING';
            const stage = getFulfillmentStage(order.fulfillmentStatus);
            const itemsCount = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);
            const pixCopyId = `pix-${order.id}`;
            const trackingCopyId = `track-${order.id}`;

            return (
              <article
                key={order.id}
                className={`bg-white border ${
                  isPendingPix ? 'border-brand-gold/70' : 'border-brand-border'
                }`}
              >
                {isPendingPix && <div className="h-[2px] w-full bg-brand-gold" />}

                {/* Cabeçalho do Pedido */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/70">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-brand-text tabular-nums">
                        #{order.orderNumber}
                      </span>

                      {order.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Pago • {order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'PIX'}
                        </span>
                      ) : order.paymentStatus === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                          <AlertCircle className="w-3 h-3" />
                          Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          {order.paymentMethod === 'CREDIT_CARD' ? (
                            <CreditCard className="w-3 h-3" />
                          ) : (
                            <QrCode className="w-3 h-3" />
                          )}
                          Aguardando pagamento • {order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'PIX'}
                        </span>
                      )}

                      {order.paymentStatus === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-background text-brand-text border border-brand-border">
                          <Truck className="w-3 h-3 text-brand-gold" />
                          {stage.label}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-brand-textMuted tabular-nums">
                      Realizado em{' '}
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {itemsCount > 0 && ` • ${itemsCount} ${itemsCount === 1 ? 'peça' : 'peças'}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="sm:text-right">
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-brand-textMuted">
                        Total
                      </span>
                      <span className="font-serif text-xl font-medium text-brand-text tabular-nums">
                        {formatBRL(order.total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className={`h-9 px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 transition-colors ${
                        isPendingPix && !isExpanded
                          ? 'bg-[#0A0A0A] text-brand-gold hover:bg-brand-gold hover:text-[#0A0A0A]'
                          : 'border border-brand-border hover:border-brand-text text-brand-text'
                      }`}
                      aria-expanded={isExpanded}
                    >
                      {isPendingPix && !isExpanded && <QrCode className="w-3.5 h-3.5" />}
                      <span>
                        {isExpanded ? 'Ocultar' : isPendingPix ? 'Pagar PIX' : 'Detalhes'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Corpo Expansível */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6 bg-brand-background/35">
                    {/* Painel PIX para Pagamento Pendente */}
                    {isPendingPix && (
                      <div className="bg-white border border-brand-border p-5 sm:p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-brand-border">
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2 w-2" aria-hidden="true">
                              <span className="animate-ping absolute inline-flex h-full w-full bg-brand-gold opacity-75" />
                              <span className="relative inline-flex h-2 w-2 bg-brand-gold" />
                            </span>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
                                Pagamento PIX Pendente
                              </p>
                              <p className="text-[11px] text-brand-textMuted mt-0.5">
                                Escaneie o QR Code ou copie a chave PIX abaixo para concluir seu pedido.
                              </p>
                            </div>
                          </div>

                          <span className="font-serif text-xl font-medium text-brand-text tabular-nums">
                            {formatBRL(order.total)}
                          </span>
                        </div>

                        {order.pixCode || order.pixQrCodeBase64 ? (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* QR Code */}
                            <div className="md:col-span-4 flex flex-col items-center">
                              <div className="w-44 h-44 bg-brand-background border border-brand-border p-2.5 relative flex items-center justify-center">
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-gold"
                                />
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-gold"
                                />
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-gold"
                                />
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-gold"
                                />
                                <div className="w-full h-full bg-white p-1.5 flex items-center justify-center">
                                  {order.pixQrCodeBase64 ? (
                                    <img
                                      src={`data:image/png;base64,${order.pixQrCodeBase64}`}
                                      alt={`QR Code PIX do pedido ${order.orderNumber}`}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-center text-[11px] text-brand-textMuted px-2 gap-1.5">
                                      <QrCode className="w-8 h-8 text-brand-gold stroke-[1.5]" />
                                      <span>Use a chave Copia e Cola ao lado</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Chave Copia e Cola + Ações */}
                            <div className="md:col-span-8 space-y-4">
                              {order.pixCode && (
                                <div className="space-y-1.5">
                                  <label
                                    htmlFor={`order-pix-code-${order.id}`}
                                    className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text"
                                  >
                                    Chave PIX (Copia e Cola)
                                  </label>
                                  <div className="flex flex-col sm:flex-row border border-brand-border bg-brand-background focus-within:border-brand-text">
                                    <input
                                      id={`order-pix-code-${order.id}`}
                                      type="text"
                                      readOnly
                                      value={order.pixCode}
                                      onFocus={(e) => e.currentTarget.select()}
                                      className="w-full sm:flex-1 min-w-0 h-11 px-3.5 bg-transparent font-mono text-xs text-brand-text focus:outline-none select-all"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void handleCopy(order.pixCode!, pixCopyId)}
                                      className={`h-11 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] flex items-center justify-center gap-2 shrink-0 transition-colors ${
                                        copiedKey === pixCopyId
                                          ? 'bg-emerald-800 text-white'
                                          : 'bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white'
                                      }`}
                                    >
                                      {copiedKey === pixCopyId ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                      <span>
                                        {copiedKey === pixCopyId ? 'Copiado!' : 'Copiar chave PIX'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <span className="inline-flex items-center gap-2 text-[11px] text-brand-textMuted">
                                  <RefreshCw className="w-3 h-3 text-brand-gold animate-spin" />
                                  <span>Confirmação automática após o pagamento</span>
                                </span>

                                <div className="flex flex-wrap items-center gap-3">
                                  {order.pixTicketUrl && (
                                    <a
                                      href={order.pixTicketUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text underline underline-offset-4 hover:text-brand-gold transition-colors"
                                    >
                                      <span>Abrir no Mercado Pago</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    disabled={checkingOrderNumber === order.orderNumber}
                                    onClick={() =>
                                      void checkOrderPaymentStatus(order.orderNumber, true)
                                    }
                                    className="h-9 px-4 border border-brand-text bg-white hover:bg-[#0A0A0A] hover:text-white text-brand-text text-[10.5px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      className={`w-3 h-3 ${
                                        checkingOrderNumber === order.orderNumber
                                          ? 'animate-spin'
                                          : ''
                                      }`}
                                    />
                                    <span>
                                      {checkingOrderNumber === order.orderNumber
                                        ? 'Verificando...'
                                        : 'Já paguei • Verificar'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-brand-background border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-brand-textMuted">
                            <span>
                              Não foi possível recuperar o QR Code ativo deste pedido (o prazo do PIX pode ter expirado). Você pode verificar o status ou gerar um novo pedido no catálogo.
                            </span>
                            <button
                              type="button"
                              disabled={checkingOrderNumber === order.orderNumber}
                              onClick={() => void checkOrderPaymentStatus(order.orderNumber, true)}
                              className="h-9 px-4 border border-brand-text text-brand-text hover:bg-[#0A0A0A] hover:text-white text-[10.5px] font-semibold uppercase tracking-[0.14em] shrink-0 transition-colors"
                            >
                              Verificar status
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progresso da Entrega */}
                    <div className="bg-white border border-brand-border p-5">
                      <div className="flex items-center justify-between gap-2 mb-5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted">
                          Linha do Tempo do Pedido
                        </span>
                        <Link
                          href={`/rastreio?pedido=${encodeURIComponent(order.orderNumber)}`}
                          className="text-[11px] font-semibold text-brand-text hover:text-brand-gold underline underline-offset-4 transition-colors"
                        >
                          Abrir página de rastreio
                        </Link>
                      </div>

                      <div className="relative">
                        <div className="absolute top-3.5 left-6 right-6 h-[1px] bg-brand-border">
                          <div
                            className="h-full bg-brand-gold transition-all duration-500"
                            style={{
                              width: `${
                                order.paymentStatus === 'PAID'
                                  ? ((stage.step - 1) / 3) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
                          {[
                            {
                              num: 1,
                              label:
                                order.paymentStatus === 'PAID'
                                  ? 'Confirmado'
                                  : order.paymentStatus === 'CANCELLED'
                                    ? 'Cancelado'
                                    : 'Aguardando PIX',
                              icon: CheckCircle2,
                            },
                            { num: 2, label: 'Preparação', icon: Package },
                            { num: 3, label: 'Em Trânsito', icon: Truck },
                            { num: 4, label: 'Entregue', icon: ShieldCheck },
                          ].map((s) => {
                            const Icon = s.icon;
                            const reached =
                              order.paymentStatus === 'PAID'
                                ? stage.step >= s.num
                                : s.num === 1 && order.paymentStatus === 'PENDING';
                            return (
                              <div key={s.num} className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 flex items-center justify-center border ${
                                    reached
                                      ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                                      : 'bg-white border-brand-border text-brand-textMuted'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-medium text-brand-text mt-2">
                                  {s.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rastreio */}
                      {order.trackingCode ? (
                        <div className="mt-5 pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-brand-textMuted block">
                              Código de Rastreio ({order.trackingCarrier || 'Transportadora'})
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs font-semibold text-brand-text">
                                {order.trackingCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleCopy(order.trackingCode!, trackingCopyId)}
                                className="p-1 text-brand-textMuted hover:text-brand-text"
                                aria-label="Copiar código de rastreio"
                              >
                                {copiedKey === trackingCopyId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <a
                            href={getCarrierUrl(order.trackingCode, order.trackingCarrier)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-4 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            <span>Rastrear entrega</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="mt-5 pt-4 border-t border-brand-border flex items-center gap-2 text-xs text-brand-textMuted">
                          <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>
                            {isPendingPix
                              ? 'Assim que o PIX for confirmado, sua peça entra imediatamente em separação.'
                              : 'Código de rastreamento será exibido automaticamente assim que o pedido for despachado.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Itens do Pedido + Endereço */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-7 bg-white border border-brand-border p-5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted block mb-3">
                          Peças Compradas
                        </span>
                        <div className="divide-y divide-brand-border">
                          {(order.items || []).map((item, idx) => (
                            <div
                              key={item.id || `${order.id}-item-${idx}`}
                              className="py-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-brand-text truncate">
                                  {item.productName}
                                </p>
                                <p className="text-[11px] text-brand-textMuted mt-0.5">
                                  Acabamento: {item.finish}
                                  {item.size ? ` • Tam: ${item.size}` : ''} • Qtd: {item.quantity}
                                </p>
                              </div>
                              <span className="font-semibold text-brand-text tabular-nums shrink-0">
                                {formatBRL(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-5 bg-white border border-brand-border p-5 space-y-4">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted flex items-center gap-1.5 mb-2">
                            <MapPin className="w-3 h-3 text-brand-gold" />
                            <span>Endereço de Entrega</span>
                          </span>
                          <div className="text-xs text-brand-text space-y-0.5 leading-relaxed">
                            <p className="font-medium">{order.customerName}</p>
                            <p>
                              {order.shippingAddress.street}, {order.shippingAddress.number}
                              {order.shippingAddress.complement
                                ? ` - ${order.shippingAddress.complement}`
                                : ''}
                            </p>
                            <p className="text-brand-textMuted">
                              {order.shippingAddress.neighborhood} — {order.shippingAddress.city}/
                              {order.shippingAddress.state}
                            </p>
                            <p className="text-brand-textMuted tabular-nums">
                              CEP: {order.shippingAddress.cep}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-brand-border space-y-1.5 text-xs tabular-nums">
                          <div className="flex justify-between text-brand-textMuted">
                            <span>Subtotal</span>
                            <span>{formatBRL(order.subtotal)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-emerald-700">
                              <span>Desconto</span>
                              <span>- {formatBRL(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-brand-textMuted">
                            <span>Frete</span>
                            <span>
                              {order.shippingCost === 0 ? 'Grátis' : formatBRL(order.shippingCost)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-brand-text pt-2 border-t border-brand-border">
                            <span>Total</span>
                            <span>{formatBRL(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
