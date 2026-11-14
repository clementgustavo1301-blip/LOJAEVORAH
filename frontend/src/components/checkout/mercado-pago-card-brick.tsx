'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { CreditCard, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || '';

export const hasMercadoPagoPublicKey = Boolean(MP_PUBLIC_KEY);

let initializedPublicKey: string | null = null;

export interface MercadoPagoCardSubmitData {
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer?: {
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
}

interface MercadoPagoCardBrickProps {
  amount: number;
  customerEmail: string;
  customerCpf?: string;
  installments: number;
  onInstallmentsChange: (installments: number) => void;
  simulatedOutcome: 'approved' | 'pending';
  onSimulatedOutcomeChange: (outcome: 'approved' | 'pending') => void;
  onCardSubmit: (data: MercadoPagoCardSubmitData) => Promise<void>;
  onErrorMessage: (message: string) => void;
}

/**
 * Renders the tokenized Mercado Pago CardPayment Brick when
 * NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY is configured, or a safe
 * PCI-free local sandbox selector for end-to-end testing beforehand.
 */
export function MercadoPagoCardBrick({
  amount,
  customerEmail,
  customerCpf,
  installments,
  onInstallmentsChange,
  simulatedOutcome,
  onSimulatedOutcomeChange,
  onCardSubmit,
  onErrorMessage,
}: MercadoPagoCardBrickProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [brickReady, setBrickReady] = useState(false);

  const cleanCpf = (customerCpf || '').replace(/\D/g, '');
  const normalizedAmount = Number(Math.max(0.01, amount).toFixed(2));

  useEffect(() => {
    if (!MP_PUBLIC_KEY) return;
    if (initializedPublicKey !== MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      initializedPublicKey = MP_PUBLIC_KEY;
    }
    setSdkReady(true);
  }, []);

  const initialization = useMemo(
    () => ({
      amount: normalizedAmount,
      payer: {
        email: customerEmail || undefined,
        identification:
          cleanCpf.length === 11
            ? { type: 'CPF', number: cleanCpf }
            : undefined,
      },
    }),
    [normalizedAmount, customerEmail, cleanCpf]
  );

  const customization = useMemo(
    () => ({
      paymentMethods: {
        minInstallments: 1,
        maxInstallments: 6,
      },
      visual: {
        style: {
          theme: 'flat' as const,
        },
      },
    }),
    []
  );

  if (!MP_PUBLIC_KEY) {
    const installmentValue = (normalizedAmount / Math.max(1, installments))
      .toFixed(2)
      .replace('.', ',');

    return (
      <div className="p-4 bg-brand-background rounded border border-brand-border space-y-4 mt-3">
        <div className="flex items-start gap-2.5 text-xs text-brand-text">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              Checkout Transparente (Modo Sandbox Local)
            </p>
            <p className="text-brand-textMuted mt-0.5 leading-relaxed">
              Nenhum dado real de cartão é trafegado aqui. Ao configurar{' '}
              <code className="px-1 py-0.5 bg-white border border-brand-border rounded-sm text-[11px]">
                NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
              </code>{' '}
              no <code className="px-1 py-0.5 bg-white border border-brand-border rounded-sm text-[11px]">.env.local</code>,
              o formulário tokenizado oficial do Mercado Pago será carregado automaticamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="sandbox-installments"
              className="text-xs font-medium text-brand-text block mb-1"
            >
              Parcelamento sem juros
            </label>
            <select
              id="sandbox-installments"
              value={installments}
              onChange={(e) => onInstallmentsChange(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-sm bg-white border border-brand-border text-sm text-brand-text focus:border-brand-text outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map((qty) => (
                <option key={qty} value={qty}>
                  {qty}x de R$ {(normalizedAmount / qty).toFixed(2).replace('.', ',')} sem juros
                </option>
              ))}
            </select>
            <p className="text-[11px] text-brand-textMuted mt-1">
              Selecionado: {installments}x de R$ {installmentValue}
            </p>
          </div>

          <div>
            <span className="text-xs font-medium text-brand-text block mb-1">
              Simulação da resposta Mercado Pago
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => onSimulatedOutcomeChange('approved')}
                className={`h-10 px-3 rounded-sm border text-xs font-medium flex items-center gap-2 transition-colors ${
                  simulatedOutcome === 'approved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-brand-border bg-white text-brand-textMuted hover:border-brand-text'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Aprovar na hora (Pago)</span>
              </button>
              <button
                type="button"
                onClick={() => onSimulatedOutcomeChange('pending')}
                className={`h-10 px-3 rounded-sm border text-xs font-medium flex items-center gap-2 transition-colors ${
                  simulatedOutcome === 'pending'
                    ? 'border-amber-600 bg-amber-50 text-amber-900'
                    : 'border-brand-border bg-white text-brand-textMuted hover:border-brand-text'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Em análise (confirmar via Webhook)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-brand-background rounded border border-brand-border space-y-3 mt-3">
      <div className="flex items-center justify-between text-xs text-brand-text">
        <div className="flex items-center gap-2 font-semibold">
          <CreditCard className="w-4 h-4" />
          <span>Dados do cartão — Mercado Pago</span>
        </div>
        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Ambiente tokenizado
        </span>
      </div>

      {!brickReady && (
        <div className="h-56 rounded-sm bg-white border border-brand-border p-4 animate-pulse flex flex-col justify-between">
          <div className="h-4 w-40 bg-brand-background rounded" />
          <div className="space-y-2.5">
            <div className="h-10 w-full bg-brand-background rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-brand-background rounded" />
              <div className="h-10 bg-brand-background rounded" />
            </div>
            <div className="h-10 w-full bg-brand-background rounded" />
          </div>
          <div className="h-10 w-full bg-brand-text/15 rounded" />
        </div>
      )}

      {sdkReady && (
        <div className={brickReady ? 'block' : 'sr-only'}>
          <CardPayment
            initialization={initialization}
            customization={customization}
            locale="pt-BR"
            onReady={() => setBrickReady(true)}
            onError={(error) => {
              const detail =
                typeof error?.message === 'string' && error.message
                  ? error.message
                  : 'Não foi possível validar os dados do cartão no Mercado Pago.';
              onErrorMessage(detail);
            }}
            onSubmit={async (brickFormData) => {
              await onCardSubmit({
                token: brickFormData.token,
                payment_method_id: brickFormData.payment_method_id,
                issuer_id: brickFormData.issuer_id,
                installments: Number(brickFormData.installments) || installments,
                payer: brickFormData.payer,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
