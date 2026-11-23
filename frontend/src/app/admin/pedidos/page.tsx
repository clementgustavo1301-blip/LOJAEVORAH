'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchOrders,
  getStoredOrdersSnapshot,
  updateOrderFulfillment,
  deleteOrder,
  detectSupplierPlatform,
  syncPendingOrdersWithServer,
  updateStoredOrderPaymentStatus,
} from '@/lib/api';
import { Order, FulfillmentStatus, Supplier } from '@/types';
import {
  buildWhatsAppHref,
  CARRIER_OPTIONS,
  getStoredSuppliers,
  resolveSupplierPreset,
} from '@/lib/suppliers';
import {
  Package,
  ExternalLink,
  Copy,
  Check,
  Truck,
  Clock,
  Search,
  RefreshCw,
  X,
  Store,
  CheckCircle2,
  CreditCard,
  QrCode,
  XCircle,
  Trash2,
  MessageCircle,
} from 'lucide-react';

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [simulatingOrderNumber, setSimulatingOrderNumber] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Modal de Envio e Rastreamento
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalSupplierIdRef, setModalSupplierIdRef] = useState('');
  const [modalSupplierName, setModalSupplierName] = useState('');
  const [modalSupplierUrl, setModalSupplierUrl] = useState('');
  const [modalSupplierId, setModalSupplierId] = useState('');
  const [modalTrackingCode, setModalTrackingCode] = useState('');
  const [modalTrackingCarrier, setModalTrackingCarrier] = useState('Correios');
  const [modalStatus, setModalStatus] = useState<FulfillmentStatus>('ORDERED_SUPPLIER');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSuppliers(getStoredSuppliers());
    const instant = getStoredOrdersSnapshot();
    if (instant.length > 0) {
      setOrders(instant);
      setLoading(false);
    }
    loadOrders(instant.length === 0);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadOrders = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchOrders();
      const synced = await syncPendingOrdersWithServer(data);
      setOrders(synced);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentApproval = async (order: Order) => {
    setSimulatingOrderNumber(order.orderNumber);
    try {
      const res = await fetch('/api/webhooks/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_payment',
          orderNumber: order.orderNumber,
          paymentId: order.paymentId,
        }),
      });
      if (res.ok) {
        updateStoredOrderPaymentStatus(order.orderNumber, 'PAID', order.paymentId);
        setOrders((prev) =>
          prev.map((o) =>
            o.orderNumber === order.orderNumber ? { ...o, paymentStatus: 'PAID' } : o
          )
        );
        showToast(`Pedido #${order.orderNumber} marcado como Pago.`);
      }
    } finally {
      setSimulatingOrderNumber(null);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Deseja excluir o pedido #${order.orderNumber}?`)) return;
    setDeletingOrderId(order.id);
    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
      showToast(`Pedido #${order.orderNumber} excluído.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir pedido.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const formatCustomerAddress = (order: Order) => {
    const addr = order.shippingAddress || ({} as any);
    return `Destinatário: ${order.customerName || 'Cliente'}
Telefone: ${order.customerPhone || 'Não informado'}
CEP: ${addr.cep || 'Não informado'}
Endereço: ${addr.street || 'Endereço não informado'}${addr.number ? `, ${addr.number}` : ''}${addr.complement ? ` - ${addr.complement}` : ''}
Bairro: ${addr.neighborhood || ''}
Cidade/UF: ${addr.city || ''}${addr.state ? ` - ${addr.state}` : ''}`;
  };

  const copyAddressFormatted = (order: Order) => {
    const text = formatCustomerAddress(order);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(order.id);
    showToast(`Endereço de ${order.customerName || 'cliente'} copiado.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSupplierLink = (order: Order, targetUrl?: string) => {
    const text = formatCustomerAddress(order);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);

    const urlToOpen = targetUrl || order.supplierUrl || order.items?.[0]?.supplierUrl;
    if (urlToOpen && typeof window !== 'undefined') {
      window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    }
    showToast('Endereço copiado para a área de transferência.');
  };

  const openFulfillmentModal = (order: Order) => {
    const plat = detectSupplierPlatform(order.supplierUrl, order.supplierName);
    const defaultCarrier =
      order.trackingCarrier || resolveSupplierPreset(plat).defaultCarrier;
    const matchedSup = suppliers.find(
      (s) => s.name.trim().toLowerCase() === (order.supplierName || '').trim().toLowerCase()
    );

    setSelectedOrder(order);
    setModalSupplierIdRef(matchedSup?.id || '');
    setModalSupplierName(order.supplierName || 'Fornecedor Parceiro');
    setModalSupplierUrl(order.supplierUrl || order.items?.[0]?.supplierUrl || '');
    setModalSupplierId(order.supplierOrderId || '');
    setModalTrackingCode(order.trackingCode || '');
    setModalTrackingCarrier(defaultCarrier);
    setModalStatus(order.fulfillmentStatus === 'PENDING_SUPPLIER' ? 'ORDERED_SUPPLIER' : order.fulfillmentStatus);
  };

  const handleSelectOrderSupplier = (supId: string) => {
    setModalSupplierIdRef(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (!sup) return;
    setModalSupplierName(sup.name);
    if (sup.websiteUrl && !modalSupplierUrl.trim()) {
      setModalSupplierUrl(sup.websiteUrl);
    }
    if (sup.defaultCarrier) {
      setModalTrackingCarrier(sup.defaultCarrier);
    }
  };

  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const nextStatus: FulfillmentStatus =
        modalTrackingCode.trim() && (modalStatus === 'PENDING_SUPPLIER' || modalStatus === 'ORDERED_SUPPLIER')
          ? 'SHIPPED'
          : modalStatus;

      await updateOrderFulfillment(selectedOrder.id, {
        fulfillmentStatus: nextStatus,
        supplierName: modalSupplierName.trim() || undefined,
        supplierUrl: modalSupplierUrl.trim() || undefined,
        supplierOrderId: modalSupplierId.trim() || undefined,
        trackingCode: modalTrackingCode.trim() || undefined,
        trackingCarrier: modalTrackingCarrier.trim() || 'Correios',
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                fulfillmentStatus: nextStatus,
                supplierName: modalSupplierName.trim() || o.supplierName,
                supplierUrl: modalSupplierUrl.trim() || o.supplierUrl,
                supplierOrderId: modalSupplierId.trim() || undefined,
                trackingCode: modalTrackingCode.trim() || undefined,
                trackingCarrier: modalTrackingCarrier.trim() || 'Correios',
              }
            : o
        )
      );

      setSelectedOrder(null);
      showToast('Informações de envio atualizadas.');
    } finally {
      setSaving(false);
    }
  };

  // Métricas
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o?.fulfillmentStatus === 'PENDING_SUPPLIER').length;
  const shippedOrders = orders.filter((o) => o?.fulfillmentStatus === 'SHIPPED').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o?.total) || 0), 0);

  // Filtros
  const filteredOrders = orders.filter((order) => {
    if (!order) return false;
    if (statusFilter !== 'ALL' && order.fulfillmentStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = (order.orderNumber || '').toLowerCase().includes(q);
      const matchCustomer = (order.customerName || '').toLowerCase().includes(q);
      const matchEmail = (order.customerEmail || '').toLowerCase().includes(q);
      const matchSupplier = (order.supplierName || '').toLowerCase().includes(q);
      const matchTracking = (order.trackingCode || '').toLowerCase().includes(q);
      return Boolean(matchNumber || matchCustomer || matchEmail || matchSupplier || matchTracking);
    }
    return true;
  });

  return (
    <div className="w-full bg-brand-background min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-brand-text">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-brand-text tracking-tight">
              Gerenciar Pedidos
            </h1>
            <p className="text-xs text-brand-textMuted mt-1">
              Acompanhe pedidos, endereços de entrega e códigos de rastreamento.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadOrders(true)}
              className="h-9 px-3 rounded-sm border border-brand-border bg-white hover:bg-brand-elevated text-xs font-semibold text-brand-text flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
            <Link
              href="/rastreio"
              target="_blank"
              className="h-9 px-4 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <span>Ver rastreio público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Total de pedidos</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {totalOrders}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Aguardando envio</span>
            <span className="text-2xl font-semibold text-amber-700 font-mono mt-1 block tabular-nums">
              {pendingOrders}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Em trânsito</span>
            <span className="text-2xl font-semibold text-blue-700 font-mono mt-1 block tabular-nums">
              {shippedOrders}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Faturamento total</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-white rounded border border-brand-border p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { label: 'Todos', value: 'ALL' },
              { label: 'Aguardando compra', value: 'PENDING_SUPPLIER' },
              { label: 'Comprados', value: 'ORDERED_SUPPLIER' },
              { label: 'Em trânsito', value: 'SHIPPED' },
              { label: 'Entregues', value: 'DELIVERED' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-sm text-xs transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-brand-text text-white font-medium'
                    : 'bg-brand-background text-brand-text hover:bg-brand-elevated'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, cliente ou rastreio..."
              className="w-full h-9 pl-8 pr-3 bg-brand-background border border-brand-border rounded-sm text-xs text-brand-text placeholder:text-brand-textMuted focus:border-brand-text outline-none"
            />
            <Search className="w-3.5 h-3.5 text-brand-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="bg-white rounded border border-brand-border overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-brand-textMuted">Carregando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-8 h-8 text-brand-textMuted mx-auto mb-2" />
              <p className="text-sm font-medium text-brand-text">Nenhum pedido encontrado</p>
              <p className="text-xs text-brand-textMuted mt-0.5">Tente alterar os filtros ou a busca.</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {filteredOrders.map((order) => {
                const isPending = order.fulfillmentStatus === 'PENDING_SUPPLIER';
                const isOrdered = order.fulfillmentStatus === 'ORDERED_SUPPLIER';
                const isShipped = order.fulfillmentStatus === 'SHIPPED';
                const isDelivered = order.fulfillmentStatus === 'DELIVERED';
                const isPaymentPaid = order.paymentStatus === 'PAID';
                const isPaymentCancelled = order.paymentStatus === 'CANCELLED';
                const methodLabel = order.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'PIX';
                const primaryUrl = order.supplierUrl || order.items?.[0]?.supplierUrl;

                return (
                  <div key={order.id} className="p-5 hover:bg-brand-background/40 transition-colors">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Dados do Pedido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-semibold text-brand-text">
                            #{order.orderNumber}
                          </span>

                          {/* Status de Pagamento */}
                          {isPaymentPaid ? (
                            <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Pago • {methodLabel}
                            </span>
                          ) : isPaymentCancelled ? (
                            <span className="px-2 py-0.5 rounded-sm bg-red-50 text-red-800 border border-red-200 text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Cancelado • {methodLabel}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1">
                              {order.paymentMethod === 'CREDIT_CARD' ? (
                                <CreditCard className="w-3 h-3" />
                              ) : (
                                <QrCode className="w-3 h-3" />
                              )}
                              Aguardando Pagamento • {methodLabel}
                            </span>
                          )}

                          {/* Status */}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Aguardando envio
                            </span>
                          )}
                          {isOrdered && (
                            <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Comprado no fornecedor
                            </span>
                          )}
                          {isShipped && (
                            <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Em trânsito ({order.trackingCode})
                            </span>
                          )}
                          {isDelivered && (
                            <span className="px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-medium">
                              Entregue
                            </span>
                          )}

                          <span className="text-xs text-brand-textMuted">
                            • {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                          </span>
                        </div>

                        {/* Cliente */}
                        <div className="text-xs text-brand-text">
                          <span className="font-medium">{order.customerName || 'Cliente'}</span>
                          <span className="text-brand-textMuted mx-1.5">•</span>
                          <span className="text-brand-textMuted">{order.customerEmail || 'E-mail não informado'}</span>
                          <span className="text-brand-textMuted mx-1.5">•</span>
                          <span className="text-brand-textMuted">{order.customerPhone || 'Sem telefone'}</span>
                        </div>

                        {/* Itens */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {order.items?.map((it, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-brand-background border border-brand-border text-xs text-brand-text"
                            >
                              <span className="font-semibold">{it.quantity || 1}x</span>
                              <span>{it.productName || 'Produto'}</span>
                              <span className="text-brand-textMuted">
                                ({it.finish || 'Padrão'}{it.size ? `, ${it.size}` : ''})
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Endereço */}
                        {order.shippingAddress ? (
                          <div className="mt-2 text-xs text-brand-textMuted">
                            Endereço: {order.shippingAddress.street || 'Rua não informada'}, {order.shippingAddress.number || 'S/N'}
                            {order.shippingAddress.complement ? ` - ${order.shippingAddress.complement}` : ''}
                            {order.shippingAddress.neighborhood ? `, ${order.shippingAddress.neighborhood}` : ''}
                            {order.shippingAddress.city ? `, ${order.shippingAddress.city}/${order.shippingAddress.state || ''}` : ''}
                            {order.shippingAddress.cep ? ` - CEP: ${order.shippingAddress.cep}` : ''}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-brand-textMuted italic">
                            Endereço de entrega não disponível
                          </div>
                        )}
                      </div>

                      {/* Valores e Ações */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-brand-border">
                        <div className="text-left lg:text-right">
                          <span className="text-xs text-brand-textMuted block">
                            {isPaymentPaid
                              ? 'Total pago'
                              : isPaymentCancelled
                                ? 'Pagamento cancelado'
                                : 'Aguardando pagamento'}
                          </span>
                          <span className="font-mono text-base font-semibold text-brand-text">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total) || 0)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {order.paymentStatus === 'PENDING' && order.paymentId?.startsWith('sim_') && (
                            <button
                              type="button"
                              onClick={() => void handleSimulatePaymentApproval(order)}
                              disabled={simulatingOrderNumber === order.orderNumber}
                              className="h-8 px-3 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {simulatingOrderNumber === order.orderNumber
                                  ? 'Confirmando...'
                                  : 'Simular Pago'}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyAddressFormatted(order)}
                            className="h-8 px-3 rounded-sm bg-white border border-brand-border hover:border-brand-text text-xs text-brand-text font-medium flex items-center gap-1.5 transition-colors"
                          >
                            {copiedId === order.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-brand-textMuted" />
                                <span>Copiar endereço</span>
                              </>
                            )}
                          </button>

                          {primaryUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenSupplierLink(order, primaryUrl)}
                              className="h-8 px-3 rounded-sm bg-brand-background border border-brand-border hover:border-brand-text text-xs text-brand-text font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Store className="w-3.5 h-3.5 text-brand-textMuted" />
                              <span>Abrir anúncio</span>
                              <ExternalLink className="w-3 h-3 text-brand-textMuted" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openFulfillmentModal(order)}
                            className="h-8 px-3 rounded-sm bg-brand-text hover:bg-brand-accent text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Atualizar envio</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteOrder(order)}
                            disabled={deletingOrderId === order.id}
                            title="Excluir pedido"
                            aria-label={`Excluir pedido #${order.orderNumber}`}
                            className="h-8 px-2.5 rounded-sm bg-white border border-brand-border hover:border-red-600 hover:text-red-600 text-xs text-brand-textMuted flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Atualização de Envio */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-brand-border max-w-lg w-full p-6 relative shadow-xl">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-medium text-brand-text">
              Pedido #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-brand-textMuted mt-0.5">
              Destinatário: {selectedOrder.customerName || 'Cliente'}
              {selectedOrder.shippingAddress?.city
                ? ` (${selectedOrder.shippingAddress.city}/${selectedOrder.shippingAddress.state || ''})`
                : ''}
            </p>

            <form onSubmit={handleSaveFulfillment} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-brand-text block mb-1.5">
                  Transportadora
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CARRIER_OPTIONS.map((carrier) => (
                    <button
                      key={carrier}
                      type="button"
                      onClick={() => setModalTrackingCarrier(carrier)}
                      className={`py-2 px-2.5 rounded-sm border text-xs font-medium transition-colors ${
                        modalTrackingCarrier === carrier
                          ? 'bg-brand-text text-white border-brand-text'
                          : 'bg-brand-background text-brand-text border-brand-border hover:border-brand-text'
                      }`}
                    >
                      {carrier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Código de Rastreamento
                </label>
                <input
                  type="text"
                  value={modalTrackingCode}
                  onChange={(e) => setModalTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ex: BR264819203812X ou AA123456789BR"
                  className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Status do Pedido
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as FulfillmentStatus)}
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  >
                    <option value="PENDING_SUPPLIER">Aguardando compra</option>
                    <option value="ORDERED_SUPPLIER">Comprado no fornecedor</option>
                    <option value="SHIPPED">Em trânsito</option>
                    <option value="DELIVERED">Entregue</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    ID do Pedido no Fornecedor (opcional)
                  </label>
                  <input
                    type="text"
                    value={modalSupplierId}
                    onChange={(e) => setModalSupplierId(e.target.value)}
                    placeholder="Ex: 26110498AB12"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
              </div>

              {suppliers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-brand-text block">
                      Fornecedor Cadastrado
                    </label>
                    {(() => {
                      const matched = suppliers.find((s) => s.id === modalSupplierIdRef);
                      const wa = buildWhatsAppHref(matched?.whatsapp);
                      return wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chamar no WhatsApp</span>
                        </a>
                      ) : null;
                    })()}
                  </div>
                  <select
                    value={modalSupplierIdRef}
                    onChange={(e) => handleSelectOrderSupplier(e.target.value)}
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  >
                    <option value="">Selecionar fornecedor salvo (opcional)</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.defaultCarrier})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Nome do Fornecedor / Loja
                  </label>
                  <input
                    type="text"
                    value={modalSupplierName}
                    onChange={(e) => setModalSupplierName(e.target.value)}
                    placeholder="Fornecedor / Atacado / Marketplace"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Link no Fornecedor (opcional)
                  </label>
                  <input
                    type="url"
                    value={modalSupplierUrl}
                    onChange={(e) => setModalSupplierUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="h-10 px-4 rounded-sm bg-brand-background hover:bg-brand-elevated text-xs font-medium text-brand-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-sm bg-brand-text hover:bg-brand-accent text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-text text-white px-4 py-3 rounded-sm shadow-lg flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
