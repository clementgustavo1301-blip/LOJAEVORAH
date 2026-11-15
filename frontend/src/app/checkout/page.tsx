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
import {
  CheckoutOrderConfirmation,
  ConfirmedOrderItemSnapshot,
  ConfirmedOrderState,
} from '@/components/checkout/checkout-order-confirmation';
import {
  MercadoPagoCardBrick,
  MercadoPagoCardSubmitData,
  hasMercadoPagoPublicKey,
} from '@/components/checkout/mercado-pago-card-brick';
import { OrderCreatePayload, OrderPaymentStatus } from '@/types';
import {
  CreditCard,
  Lock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  MapPin,
} from 'lucide-react';

function formatCpfInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidCpf(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calcDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  return calcDigit(9) === Number(digits[9]) && calcDigit(10) === Number(digits[10]);
}

export default function CheckoutPage() {
  const { items, subtotal, discount, shippingFee, total, coupon, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
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
    if (step === 1 && !isValidCpf(formData.cpf)) {
      setCheckoutError('Informe um CPF válido.');
      return;
    }
    if (step < 3) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    } else if (step === 3 && !isBrickActiveStep) {
      void handleFinalizeOrder();
    }
  };

  const buildConfirmationSnapshot = useCallback((): {
    customerName: string;
    shippingAddressLine: string;
    subtotal: number;
    discount: number;
    pixDiscount: number;
    shippingFee: number;
    items: ConfirmedOrderItemSnapshot[];
  } => {
    const complementPart = formData.complement ? ` — ${formData.complement}` : '';
    const shippingAddressLine = `${formData.street}, ${formData.number}${complementPart}, ${formData.neighborhood}, ${formData.city}/${formData.state} • CEP ${formData.cep}`;
    return {
      customerName: formData.name,
      shippingAddressLine,
      subtotal,
      discount,
      pixDiscount,
      shippingFee,
      items: items.map((item) => ({
        id: item.id,
        name: item.product.name,
        finish: item.finish,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    };
  }, [formData, items, subtotal, discount, pixDiscount, shippingFee]);

  const handleFinalizeOrder = async () => {
    setCheckoutError(null);
    setIsSubmitting(true);
    try {
      const payload = buildOrderPayload();
      const snapshot = buildConfirmationSnapshot();
      const result = await createOrder({
        ...payload,
        simulatedOutcome,
      });

      setOrderConfirmed({
        ...(result as ConfirmedOrderState),
        customerName: snapshot.customerName,
        shippingAddressLine: snapshot.shippingAddressLine,
        subtotal: snapshot.subtotal,
        discount: snapshot.discount,
        pixDiscount: snapshot.pixDiscount,
        shippingFee: snapshot.shippingFee,
        items: snapshot.items,
      });
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
      const snapshot = buildConfirmationSnapshot();
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
        customerName: snapshot.customerName,
        customerEmail: formData.email,
        shippingAddressLine: snapshot.shippingAddressLine,
        total: data.total ?? finalTotal,
        subtotal: snapshot.subtotal,
        discount: snapshot.discount,
        pixDiscount: 0,
        shippingFee: snapshot.shippingFee,
        items: snapshot.items,
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
    <div className="w-full bg-brand-background min-h-screen py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho Editorial do Checkout */}
        <div className="flex flex-wrap items-end justify-between gap-3 pb-5 border-b border-brand-border mb-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
              {step === 4 ? 'Ateliê EVORAH • Comprovante' : 'Ateliê EVORAH • Checkout'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-brand-text mt-1">
              {step === 4 ? 'Confirmação do Pedido' : 'Finalização da Compra'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-textMuted pb-0.5">
            <Lock className="w-3.5 h-3.5 text-brand-gold" strokeWidth={1.75} />
            <span>Ambiente criptografado • Mercado Pago</span>
          </div>
        </div>

        {/* Barra de Progresso Arquitetônica */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8 text-xs font-medium">
          {[
            { num: 1, label: 'Identificação' },
            { num: 2, label: 'Entrega' },
            { num: 3, label: 'Pagamento' },
            { num: 4, label: 'Confirmação' },
          ].map((st) => {
            const isReached = step >= st.num;
            const isCurrent = step === st.num;
            return (
              <div
                key={st.num}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${isCurrent
                  ? 'border-brand-gold text-brand-text font-semibold'
                  : isReached
                    ? 'border-brand-text text-brand-text font-semibold'
                    : 'border-brand-border text-brand-textMuted'
                  }`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono tabular-nums shrink-0 ${isCurrent
                    ? 'bg-[#0A0A0A] text-brand-gold border border-brand-gold/60'
                    : isReached
                      ? 'bg-brand-text text-white'
                      : 'bg-brand-elevated text-brand-textMuted border border-brand-border'
                    }`}
                >
                  {step > st.num ? '✓' : `0${st.num}`}
                </span>
                <span
                  className={
                    isCurrent
                      ? 'inline truncate text-[11px] sm:text-xs'
                      : 'hidden sm:inline truncate'
                  }
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Etapa 4: Confirmação */}
        {step === 4 && orderConfirmed ? (
          <CheckoutOrderConfirmation
            orderConfirmed={orderConfirmed}
            copiedPix={copiedPix}
            onCopyPix={copyPixCode}
            checkingPayment={checkingPayment}
            onCheckPayment={() => void checkPaymentStatusOnce(orderConfirmed.orderNumber, true)}
            simulatingWebhook={simulatingWebhook}
            onSimulateWebhook={handleSimulateWebhookApproval}
          />
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
                        <label htmlFor="checkout-name" className="text-xs font-medium text-brand-text block mb-1">
                          Nome completo
                        </label>
                        <input
                          id="checkout-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Seu nome completo"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="checkout-email" className="text-xs font-medium text-brand-text block mb-1">
                            E-mail
                          </label>
                          <input
                            id="checkout-email"
                            type="email"
                            autoComplete="email"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="checkout-phone" className="text-xs font-medium text-brand-text block mb-1">
                            Telefone / WhatsApp
                          </label>
                          <input
                            id="checkout-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={15}
                            placeholder="(00) 00000-0000"
                            required
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })
                            }
                            className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="checkout-cpf" className="text-xs font-medium text-brand-text block mb-1">
                          CPF
                        </label>
                        <input
                          id="checkout-cpf"
                          type="text"
                          inputMode="numeric"
                          maxLength={14}
                          placeholder="000.000.000-00"
                          required
                          value={formData.cpf}
                          onChange={(e) =>
                            setFormData({ ...formData, cpf: formatCpfInput(e.target.value) })
                          }
                          className="w-full h-10 px-3 rounded-sm bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none transition-colors"
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
                            placeholder="Nome da rua ou avenida"
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
                            placeholder="Nº"
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
                            placeholder="Opcional"
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
                            placeholder="Bairro"
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
                            placeholder="Cidade"
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
                            placeholder="UF"
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
