'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import {
  createOrder,
  saveCompletedOrderLocally,
  updateStoredOrderPaymentStatus,
} from '@/lib/api';
import { fetchAddressByCep, formatCepInput } from '@/lib/cep';
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';
import { Logo } from '@/components/ui/logo';
import {
  MercadoPagoCardBrick,
  MercadoPagoCardSubmitData,
  hasMercadoPagoPublicKey,
} from '@/components/checkout/mercado-pago-card-brick';
import { OrderCreatePayload, OrderPaymentStatus } from '@/types';
import {
  QrCode,
  CreditCard,
  Lock,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  MapPin,
} from 'lucide-react';

interface ConfirmedOrderState {
  id: string;
  orderNumber: string;
  paymentId?: string;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  customerEmail: string;
  total: number;
  subtotal?: number;
  discount?: number;
  pixCode?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  ticketUrl?: string;
  simulated?: boolean;
}

export default function CheckoutPage() {
  const { items, subtotal, discount, shippingFee, total, coupon, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    name: 'Alexandre Silva',
    email: 'alexandre@email.com',
    phone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Apto 102',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    paymentMethod: 'PIX' as 'PIX' | 'CREDIT_CARD',
    installments: 6,
  });

  const [simulatedOutcome, setSimulatedOutcome] = useState<'approved' | 'pending'>('approved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<ConfirmedOrderState | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepSuccessCity, setCepSuccessCity] = useState<string | null>(null);
  const numberInputRef = useRef<HTMLInputElement | null>(null);
  const cepAbortRef = useRef<AbortController | null>(null);

  const lookupCepAndFillAddress = useCallback(async (digits: string, focusNumber: boolean) => {
    cepAbortRef.current?.abort();
    const controller = new AbortController();
    cepAbortRef.current = controller;

    setLoadingCep(true);
    setCepError(null);
    setCepSuccessCity(null);

    try {
      const address = await fetchAddressByCep(digits, controller.signal);
      if (controller.signal.aborted) return;

      if (!address) {
        setCepError('CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        cep: address.cep,
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }));
      setCepSuccessCity(`${address.city}/${address.state}`);
      if (focusNumber && address.street) {
        requestAnimationFrame(() => numberInputRef.current?.focus());
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCep(false);
      }
    }
  }, []);

  const handleCepChange = (rawValue: string) => {
    const formatted = formatCepInput(rawValue);
    const digits = formatted.replace(/\D/g, '');

    setFormData((prev) => ({ ...prev, cep: formatted }));
    setCepError(null);
    setCepSuccessCity(null);

    if (digits.length === 8) {
      void lookupCepAndFillAddress(digits, true);
    } else {
      cepAbortRef.current?.abort();
      setLoadingCep(false);
    }
  };

  useEffect(() => () => cepAbortRef.current?.abort(), []);

  const pixDiscount = formData.paymentMethod === 'PIX' ? (subtotal - discount) * 0.05 : 0;
  const finalTotal = Math.max(0, total - pixDiscount);
  const isBrickActiveStep =
    step === 3 && formData.paymentMethod === 'CREDIT_CARD' && hasMercadoPagoPublicKey;

  const buildOrderPayload = useCallback((): OrderCreatePayload => ({
    customerName: formData.name,
    customerEmail: formData.email,
    customerPhone: formData.phone,
    customerCpf: formData.cpf,
    shippingAddress: {
      cep: formData.cep,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
    },
    shippingMethod: 'Sedex',
    paymentMethod: formData.paymentMethod,
    installments: formData.installments,
    items: items.map((i) => ({
      productId: i.productId,
      finish: i.finish,
      size: i.size,
      quantity: i.quantity,
    })),
    couponCode: coupon,
  }), [formData, items, coupon]);

  const applyConfirmedPayment = useCallback(
    (orderNumber: string, paymentStatus: OrderPaymentStatus, paymentId?: string) => {
      setOrderConfirmed((prev) => {
        if (!prev || prev.orderNumber !== orderNumber) return prev;
        if (prev.paymentStatus === paymentStatus && (!paymentId || prev.paymentId === paymentId)) {
          return prev;
        }
        return {
          ...prev,
          paymentStatus,
          paymentId: paymentId || prev.paymentId,
        };
      });
      updateStoredOrderPaymentStatus(orderNumber, paymentStatus, paymentId);
    },
    []
  );

  const checkPaymentStatusOnce = useCallback(
    async (orderNumber: string, manual = false) => {
      if (manual) setCheckingPayment(true);
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}/status`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.found && data.paymentStatus) {
          applyConfirmedPayment(orderNumber, data.paymentStatus, data.paymentId);
        }
      } catch {
        // Keep polling gracefully on transient network hiccups
      } finally {
        if (manual) setCheckingPayment(false);
      }
    },
    [applyConfirmedPayment]
  );

  useEffect(() => {
    if (step !== 4 || !orderConfirmed?.orderNumber) return;
    if (orderConfirmed.paymentStatus !== 'PENDING') return;

    const orderNum = orderConfirmed.orderNumber;
    const interval = setInterval(() => {
      void checkPaymentStatusOnce(orderNum, false);
    }, 2500);

    const supabaseClient = isSupabaseConfigured() ? getSupabaseBrowserClient() : null;
    let channel: ReturnType<NonNullable<typeof supabaseClient>['channel']> | null = null;
    if (supabaseClient) {
      try {
        channel = supabaseClient
          .channel(`order-payment-${orderNum}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `order_number=eq.${orderNum}`,
            },
            (payload: { new?: Record<string, unknown> }) => {
              const row = payload.new as
                | { payment_status?: OrderPaymentStatus; payment_id?: string }
                | undefined;
              if (row?.payment_status) {
                applyConfirmedPayment(orderNum, row.payment_status, row.payment_id);
              }
            }
          )
          .subscribe();
      } catch {
        // Fallback polling remains active
      }
    }

    return () => {
      clearInterval(interval);
      if (channel && supabaseClient) {
        try {
          supabaseClient.removeChannel(channel);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [
    step,
    orderConfirmed?.orderNumber,
    orderConfirmed?.paymentStatus,
    checkPaymentStatusOnce,
    applyConfirmedPayment,
  ]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    } else if (step === 3 && !isBrickActiveStep) {
      void handleFinalizeOrder();
    }
  };

  const handleFinalizeOrder = async () => {
    setCheckoutError(null);
    setIsSubmitting(true);
    try {
      const payload = buildOrderPayload();
      const result = await createOrder({
        ...payload,
        simulatedOutcome,
      });

      setOrderConfirmed(result as ConfirmedOrderState);
      setStep(4);
      clearCart();
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : 'Erro ao processar pedido. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardBrickSubmit = async (brickData: MercadoPagoCardSubmitData) => {
    setCheckoutError(null);
    setIsSubmitting(true);
    try {
      const payload = buildOrderPayload();
      const res = await fetch('/api/checkout/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          ...brickData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pagamento com cartão recusado.');
      }

      saveCompletedOrderLocally({
        orderNumber: data.orderNumber,
        payload,
        paymentStatus: data.paymentStatus || 'PAID',
        paymentId: data.paymentId,
        total: data.total ?? finalTotal,
        subtotal: data.subtotal,
        discount: data.discount,
      });

      setOrderConfirmed({
        id: data.orderNumber,
        orderNumber: data.orderNumber,
        paymentId: data.paymentId,
        paymentStatus: data.paymentStatus || 'PAID',
        paymentMethod: 'CREDIT_CARD',
        customerEmail: formData.email,
        total: data.total ?? finalTotal,
        subtotal: data.subtotal,
        discount: data.discount,
        simulated: Boolean(data.simulated),
      });
      setStep(4);
      clearCart();
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Erro ao processar pagamento com cartão.'
      );
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateWebhookApproval = async () => {
    if (!orderConfirmed?.orderNumber || simulatingWebhook) return;
    setSimulatingWebhook(true);
    try {
      const res = await fetch('/api/webhooks/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_payment',
          orderNumber: orderConfirmed.orderNumber,
          paymentId: orderConfirmed.paymentId,
        }),
      });
      if (res.ok) {
        await checkPaymentStatusOnce(orderConfirmed.orderNumber, true);
      }
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const copyPixCode = async () => {
    if (orderConfirmed?.pixCode) {
      try {
        await navigator.clipboard?.writeText(orderConfirmed.pixCode);
      } catch {
        // Clipboard API may be blocked in non-HTTPS contexts
      }
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  if (items.length === 0 && step !== 4) {
    return (
      <div className="w-full min-h-[60vh] bg-brand-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-base font-medium text-brand-text mb-3">Sua sacola está vazia</h2>
        <Link href="/produtos" className="h-10 px-6 rounded-sm bg-brand-text text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center hover:bg-brand-accent transition-colors">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-brand-background min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho Limpo */}
        <div className="flex items-center justify-between pb-5 border-b border-brand-border mb-6">
          <Logo variant="horizontal" color="black" />
          <div className="flex items-center gap-1.5 text-xs text-brand-textMuted">
            <Lock className="w-3.5 h-3.5 text-brand-text" />
            <span>Compra segura</span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="grid grid-cols-4 gap-2 mb-8 text-xs font-medium">
          {[
            { num: 1, label: 'Identificação' },
            { num: 2, label: 'Entrega' },
            { num: 3, label: 'Pagamento' },
            { num: 4, label: 'Confirmação' },
          ].map((st) => (
            <div
              key={st.num}
              className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${step >= st.num
                ? 'border-brand-text text-brand-text font-semibold'
                : 'border-brand-border text-brand-textMuted'
                }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step >= st.num ? 'bg-brand-text text-white' : 'bg-brand-border text-brand-textMuted'}`}>
                {step > st.num ? '✓' : st.num}
              </span>
              <span className="hidden sm:inline">{st.label}</span>
            </div>
          ))}
        </div>

        {/* Etapa 4: Confirmação */}
        {step === 4 && orderConfirmed ? (
          <div className="bg-white rounded border border-brand-border p-6 sm:p-8 text-center max-w-lg mx-auto space-y-5">
            {orderConfirmed.paymentStatus === 'PAID' ? (
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : orderConfirmed.paymentStatus === 'CANCELLED' ? (
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
            )}

            <div>
              {orderConfirmed.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pago • Pagamento confirmado
                </span>
              ) : orderConfirmed.paymentStatus === 'CANCELLED' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-50 text-red-800 border border-red-200 text-xs font-semibold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pagamento cancelado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  {orderConfirmed.paymentMethod === 'PIX'
                    ? 'Aguardando pagamento PIX'
                    : 'Em análise — aguardando confirmação'}
                </span>
              )}

              <h2 className="text-xl font-serif font-medium text-brand-text mt-2 tabular-nums">
                Pedido #{orderConfirmed.orderNumber}
              </h2>
              <p className="text-xs text-brand-textMuted mt-1">
                Enviamos os detalhes da compra para <strong>{orderConfirmed.customerEmail}</strong>.
              </p>
            </div>

            {orderConfirmed.paymentStatus === 'PAID' && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded text-left flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <p className="font-semibold">
                    {orderConfirmed.paymentMethod === 'PIX'
                      ? 'PIX recebido e aprovado!'
                      : 'Pagamento aprovado no cartão!'}
                  </p>
                  <p className="text-emerald-800/90">
                    Total pago: R$ {Number(orderConfirmed.total).toFixed(2).replace('.', ',')} • Seu pedido entrou em preparação.
                  </p>
                </div>
              </div>
            )}

            {orderConfirmed.paymentMethod === 'PIX' && orderConfirmed.paymentStatus === 'PENDING' && (
              <div className="p-5 bg-brand-background rounded border border-brand-border text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
                    <QrCode className="w-4 h-4" />
                    <span>Pagamento via PIX</span>
                  </div>
                  <span className="text-sm font-semibold text-brand-text tabular-nums">
                    R$ {Number(orderConfirmed.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded p-4 border border-brand-border">
                  <div className="w-24 h-24 bg-white p-1 rounded flex items-center justify-center shrink-0 border border-brand-border overflow-hidden">
                    {orderConfirmed.pixQrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${orderConfirmed.pixQrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-black p-1 grid grid-cols-4 gap-0.5">
                        <div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" />
                        <div className="bg-white" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                        <div className="bg-black" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" />
                        <div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-xs text-brand-textMuted space-y-2 w-full">
                    <p>Escaneie o código com seu banco ou copie a chave:</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={orderConfirmed.pixCode || ''}
                        className="flex-1 h-9 px-3 rounded-l-sm bg-brand-background border border-brand-border border-r-0 text-xs text-brand-text font-mono"
                      />
                      <button
                        type="button"
                        onClick={copyPixCode}
                        className="h-9 px-3.5 rounded-r-sm bg-brand-text text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:bg-brand-accent transition-colors"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPix ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {orderConfirmed.ticketUrl && (
                  <div>
                    <a
                      href={orderConfirmed.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text underline underline-offset-4 hover:text-brand-accent"
                    >
                      Abrir ticket / QR no Mercado Pago ↗
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-brand-textMuted">
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Atualização automática ativa após o pagamento...
                  </span>
                  <button
                    type="button"
                    onClick={() => void checkPaymentStatusOnce(orderConfirmed.orderNumber, true)}
                    disabled={checkingPayment}
                    className="font-semibold text-brand-text hover:underline disabled:opacity-50"
                  >
                    {checkingPayment ? 'Verificando...' : 'Já paguei • Verificar agora'}
                  </button>
                </div>
              </div>
            )}

            {orderConfirmed.paymentStatus === 'PENDING' && orderConfirmed.simulated && (
              <div className="p-3.5 rounded border border-dashed border-brand-border bg-brand-background/70 space-y-2">
                <p className="text-[11px] text-brand-textMuted">
                  Modo sandbox local ativo (sem credenciais Mercado Pago): teste o retorno automático do webhook aqui.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateWebhookApproval}
                  disabled={simulatingWebhook}
                  className="w-full h-10 px-4 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
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

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/rastreio?pedido=${orderConfirmed.orderNumber}`}
                className="h-10 px-5 rounded-sm border border-brand-border bg-white text-brand-text hover:border-brand-text font-semibold text-xs tracking-wider uppercase flex items-center justify-center transition-colors"
              >
                Acompanhar pedido
              </Link>
              <Link
                href="/produtos"
                className="h-10 px-6 rounded-sm bg-brand-text text-white hover:bg-brand-accent font-semibold text-xs tracking-wider uppercase flex items-center justify-center transition-colors"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Formulário */}
            <div className="lg:col-span-7 bg-white rounded border border-brand-border p-6 space-y-5">
              {checkoutError && (
                <div className="p-3.5 rounded-sm bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}
              <form onSubmit={handleNextStep} className="space-y-5">
                {/* ETAPA 1: DADOS */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-brand-text pb-2.5 border-b border-brand-border">
                      Dados Pessoais
                    </h3>
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-brand-text block mb-1">
                          Nome completo
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-medium text-brand-text block mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-brand-text block mb-1">
                            Telefone / WhatsApp
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-brand-text block mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 2: ENDEREÇO */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-brand-border">
                      <h3 className="text-xs font-semibold tracking-wider uppercase text-brand-text">
                        Endereço de Entrega
                      </h3>
                      {loadingCep ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-textMuted">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Buscando endereço...
                        </span>
                      ) : cepSuccessCity ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <MapPin className="w-3 h-3" />
                          {cepSuccessCity} preenchido
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label htmlFor="checkout-cep" className="text-xs font-medium text-brand-text block mb-1">
                            CEP
                          </label>
                          <div className="relative">
                            <input
                              id="checkout-cep"
                              type="text"
                              inputMode="numeric"
                              autoComplete="postal-code"
                              maxLength={9}
                              placeholder="00000-000"
                              required
                              value={formData.cep}
                              onChange={(e) => handleCepChange(e.target.value)}
                              className="w-full h-10 px-3 pr-8 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none transition-colors"
                            />
                            {loadingCep && (
                              <Loader2 className="w-3.5 h-3.5 text-brand-textMuted animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                          </div>
                          {cepError && (
                            <p className="text-[11px] text-red-600 mt-1">{cepError}</p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="checkout-street" className="text-xs font-medium text-brand-text block mb-1">
                            Rua / Avenida
                          </label>
                          <input
                            id="checkout-street"
                            type="text"
                            autoComplete="street-address"
                            required
                            value={formData.street}
                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="checkout-number" className="text-xs font-medium text-brand-text block mb-1">
                            Número
                          </label>
                          <input
                            id="checkout-number"
                            ref={numberInputRef}
                            type="text"
                            required
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="checkout-complement" className="text-xs font-medium text-brand-text block mb-1">
                            Complemento
                          </label>
                          <input
                            id="checkout-complement"
                            type="text"
                            value={formData.complement}
                            onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="checkout-neighborhood" className="text-xs font-medium text-brand-text block mb-1">
                            Bairro
                          </label>
                          <input
                            id="checkout-neighborhood"
                            type="text"
                            autoComplete="address-level3"
                            required
                            value={formData.neighborhood}
                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="checkout-city" className="text-xs font-medium text-brand-text block mb-1">
                            Cidade
                          </label>
                          <input
                            id="checkout-city"
                            type="text"
                            autoComplete="address-level2"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="checkout-state" className="text-xs font-medium text-brand-text block mb-1">
                            Estado
                          </label>
                          <input
                            id="checkout-state"
                            type="text"
                            autoComplete="address-level1"
                            maxLength={2}
                            required
                            value={formData.state}
                            onChange={(e) =>
                              setFormData({ ...formData, state: e.target.value.toUpperCase() })
                            }
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text uppercase focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPA 3: PAGAMENTO */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-brand-text pb-2.5 border-b border-brand-border">
                      Forma de Pagamento
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'PIX' })}
                        className={`p-4 border rounded text-left transition-colors ${formData.paymentMethod === 'PIX'
                          ? 'border-brand-text bg-white text-brand-text'
                          : 'border-brand-border bg-brand-background text-brand-textMuted hover:border-brand-text'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs uppercase tracking-wider">PIX</span>
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-medium">
                            -5% OFF
                          </span>
                        </div>
                        <p className="text-xs text-brand-textMuted">Aprovação imediata</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'CREDIT_CARD' })}
                        className={`p-4 border rounded text-left transition-colors ${formData.paymentMethod === 'CREDIT_CARD'
                          ? 'border-brand-text bg-white text-brand-text'
                          : 'border-brand-border bg-brand-background text-brand-textMuted hover:border-brand-text'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs uppercase tracking-wider">Cartão</span>
                          <CreditCard className="w-4 h-4 text-brand-text" />
                        </div>
                        <p className="text-xs text-brand-textMuted">Até 6x sem juros</p>
                      </button>
                    </div>

                    {formData.paymentMethod === 'CREDIT_CARD' && !hasMercadoPagoPublicKey && (
                      <MercadoPagoCardBrick
                        amount={finalTotal}
                        customerEmail={formData.email}
                        customerCpf={formData.cpf}
                        installments={formData.installments}
                        onInstallmentsChange={(installments) =>
                          setFormData({ ...formData, installments })
                        }
                        simulatedOutcome={simulatedOutcome}
                        onSimulatedOutcomeChange={setSimulatedOutcome}
                        onCardSubmit={handleCardBrickSubmit}
                        onErrorMessage={setCheckoutError}
                      />
                    )}
                  </div>
                )}

                {/* Navegação de Etapas (fora quando CardPayment Brick estiver ativo) */}
                {!isBrickActiveStep && (
                  <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                        className="h-9 px-3 text-xs font-semibold text-brand-textMuted hover:text-brand-text uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar</span>
                      </button>
                    ) : (
                      <Link href="/carrinho" className="text-xs font-semibold text-brand-textMuted hover:text-brand-text uppercase tracking-wider transition-colors">
                        Voltar à sacola
                      </Link>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-6 rounded-sm bg-brand-text text-white hover:bg-brand-accent font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <span>
                        {step === 3
                          ? isSubmitting
                            ? 'Processando...'
                            : `Finalizar pedido (R$ ${finalTotal.toFixed(2).replace('.', ',')})`
                          : 'Avançar'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </form>

              {isBrickActiveStep && (
                <div className="space-y-4">
                  <MercadoPagoCardBrick
                    amount={finalTotal}
                    customerEmail={formData.email}
                    customerCpf={formData.cpf}
                    installments={formData.installments}
                    onInstallmentsChange={(installments) =>
                      setFormData({ ...formData, installments })
                    }
                    simulatedOutcome={simulatedOutcome}
                    onSimulatedOutcomeChange={setSimulatedOutcome}
                    onCardSubmit={handleCardBrickSubmit}
                    onErrorMessage={setCheckoutError}
                  />
                  <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-9 px-3 text-xs font-semibold text-brand-textMuted hover:text-brand-text uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>
                    <span className="text-xs text-brand-textMuted tabular-nums">
                      Total: R$ {finalTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumo Lateral */}
            <div className="lg:col-span-5 bg-white rounded border border-brand-border p-6 space-y-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-brand-text pb-2.5 border-b border-brand-border">
                Itens do Pedido ({items.length})
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {items.map((i) => (
                  <div key={i.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-medium text-brand-text">{i.product.name}</p>
                      <p className="text-xs text-brand-textMuted">
                        Qtd: {i.quantity} • {i.finish} {i.size ? `• ${i.size}` : ''}
                      </p>
                    </div>
                    <span className="text-brand-text font-semibold tabular-nums">
                      R$ {(i.price * i.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-brand-border space-y-2 text-xs text-brand-textMuted tabular-nums">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-brand-text">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Cupom</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                {formData.paymentMethod === 'PIX' && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Desconto PIX (5%)</span>
                    <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span className="text-brand-text">{shippingFee === 0 ? 'Grátis' : `R$ ${shippingFee.toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-brand-text pt-2.5 border-t border-brand-border">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
