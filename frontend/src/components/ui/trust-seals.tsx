import React from 'react';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface TrustSealsProps {
  variant?: 'footer-band' | 'checkout-panel' | 'inline-compact';
  className?: string;
}

const TRUST_ITEMS = [
  {
    id: 'ssl',
    title: 'Site Seguro • Certificado SSL',
    shortTitle: 'Site Seguro SSL',
    description:
      'Criptografia SSL 256-bit de ponta a ponta para proteger seus dados pessoais e bancários.',
    shortDescription: 'Conexão 100% criptografada',
    icon: Lock,
  },
  {
    id: 'guarantee',
    title: 'Compra 100% Garantida',
    shortTitle: 'Compra 100% Garantida',
    description:
      'Receba seu pedido com código de rastreio assegurado, cobertura contra extravio e troca garantida em até 7 dias.',
    shortDescription: 'Entrega garantida e troca em 7 dias',
    icon: ShieldCheck,
  },
  {
    id: 'payment',
    title: 'Pagamento Protegido',
    shortTitle: 'Ambiente Certificado',
    description:
      'Processamento oficial via Mercado Pago com proteção ao comprador no PIX e no cartão de crédito.',
    shortDescription: 'Mercado Pago oficial',
    icon: CheckCircle2,
  },
] as const;

export function TrustSeals({ variant = 'footer-band', className = '' }: TrustSealsProps) {
  if (variant === 'inline-compact') {
    return (
      <div
        className={`pt-3.5 border-t border-brand-border grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`.trim()}
      >
        {TRUST_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-2.5 p-2.5 bg-brand-background/70 border border-brand-border"
            >
              <Icon className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text leading-tight">
                  {item.shortTitle}
                </p>
                <p className="text-[11px] text-brand-textMuted leading-snug mt-0.5">
                  {item.shortDescription}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === 'checkout-panel') {
    return (
      <div
        className={`p-5 sm:p-6 bg-white border border-brand-border space-y-3.5 ${className}`.trim()}
        aria-label="Selos de segurança e garantia EVORAH"
      >
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-brand-border">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text">
            Segurança & Garantia
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            <Lock className="w-3 h-3 text-emerald-700" strokeWidth={2} />
            <span>SSL Ativo</span>
          </span>
        </div>

        <ul className="space-y-3">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex items-start gap-2.5">
                <span className="w-7 h-7 bg-brand-background border border-brand-border flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-brand-gold" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-brand-text leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-brand-textMuted leading-relaxed mt-0.5">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-brand-border bg-brand-background/60 px-6 sm:px-10 lg:px-12 py-7 ${className}`.trim()}
      aria-label="Garantias e segurança da loja"
    >
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-3 md:divide-x divide-brand-border">
        {TRUST_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const padClass =
            idx === 0
              ? 'pb-5 md:pb-0 md:pr-8'
              : idx === 1
                ? 'py-5 md:py-0 md:px-8 border-t md:border-t-0 border-brand-border'
                : 'pt-5 md:pt-0 md:pl-8 border-t md:border-t-0 border-brand-border';
          return (
            <div key={item.id} className={`flex items-start gap-3.5 ${padClass}`}>
              <span className="w-9 h-9 bg-white border border-brand-border flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-gold" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                  {item.title}
                </h3>
                <p className="text-xs text-brand-textMuted leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
