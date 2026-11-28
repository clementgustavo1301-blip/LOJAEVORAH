'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
    } catch {
      // Ignore clipboard failures
    }
    setCopiedCode(value);
    setTimeout(() => setCopiedCode(null), 2000);
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
              Assim que realizar sua primeira compra na EVORAH, o comprovante, o status do pagamento e o rastreio aparecerão aqui.
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
            const stage = getFulfillmentStage(order.fulfillmentStatus);
            const itemsCount = (order.items || []).reduce((acc, it) => acc + it.quantity, 0);

            return (
              <article key={order.id} className="bg-white border border-brand-border">
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
                          Aguardando pagamento
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-brand-background text-brand-text border border-brand-border">
                        <Truck className="w-3 h-3 text-brand-gold" />
                        {stage.label}
                      </span>
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
                      className="h-9 px-3 border border-brand-border hover:border-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text inline-flex items-center gap-1.5 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
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
                            style={{ width: `${((stage.step - 1) / 3) * 100}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
                          {[
                            { num: 1, label: 'Confirmado', icon: CheckCircle2 },
                            { num: 2, label: 'Preparação', icon: Package },
                            { num: 3, label: 'Em Trânsito', icon: Truck },
                            { num: 4, label: 'Entregue', icon: ShieldCheck },
                          ].map((s) => {
                            const Icon = s.icon;
                            const reached = stage.step >= s.num;
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
                                onClick={() => void handleCopy(order.trackingCode!)}
                                className="p-1 text-brand-textMuted hover:text-brand-text"
                                aria-label="Copiar código de rastreio"
                              >
                                {copiedCode === order.trackingCode ? (
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
                            Código de rastreamento será exibido automaticamente assim que o pedido for despachado.
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
