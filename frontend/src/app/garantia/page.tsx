import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Droplets, Sparkles, Mail, ArrowRight } from 'lucide-react';
import { TrustSeals } from '@/components/ui/trust-seals';

export const metadata: Metadata = {
  title: 'Garantia Vitalícia contra Oxidação',
  description:
    'Certificado de Garantia Vitalícia EVORAH EXPERIENCE para joias em Aço Cirúrgico 316L e Prata 925. Cobertura contra oxidação, escurecimento e descascamento.',
  alternates: { canonical: '/garantia' },
};

const COBERTURAS = [
  {
    icon: ShieldCheck,
    title: 'Garantia Vitalícia na Liga 316L',
    text: 'Todas as peças EVORAH em Aço Cirúrgico 316L possuem cobertura vitalícia contra oxidação, ferrugem e descascamento. O metal maciço preserva seu brilho original ao longo dos anos.',
  },
  {
    icon: Droplets,
    title: 'Resistência à Água, Mar e Piscina',
    text: 'Projetadas para acompanhamento contínuo na rotina: banho diário, treino, água do mar e piscina clorada. A estrutura molecular do Aço 316L não descasca em contato com água ou suor.',
  },
  {
    icon: Sparkles,
    title: 'Prata 925 & Hipoalergenicidade',
    text: 'Nossas ligas metálicas são livres de níquel reativo e cádmio, reduzindo drasticamente o risco de irritação cutânea. Para joias em Prata 925, garantimos autenticidade do teor 925 e repolimento gratuito.',
  },
];

export default function GarantiaPage() {
  return (
    <div className="w-full bg-brand-background py-14 sm:py-20 px-6 sm:px-10 lg:px-12 flex-1">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="border-b border-brand-border pb-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            Certificado Oficial EVORAH
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-text font-normal tracking-tight">
            Garantia Vitalícia contra Oxidação
          </h1>
          <p className="text-xs sm:text-sm text-brand-textMuted mt-3 max-w-2xl leading-relaxed">
            Cada peça EVORAH EXPERIENCE é produzida sob rigor de joalheria contemporânea para permanecer inalterável no uso diário. Conheça os termos completos do seu certificado de garantia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COBERTURAS.map((item) => {
            const Icon = item.icon;
            return (
              <section
                key={item.title}
                className="bg-white border border-brand-border p-6 flex flex-col gap-3"
              >
                <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
                  <Icon className="w-4 h-4 text-brand-gold stroke-[1.6]" />
                </span>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
                  {item.title}
                </h2>
                <p className="text-xs text-brand-textMuted leading-relaxed">
                  {item.text}
                </p>
              </section>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-brand-border p-7 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-2">
                O que a Garantia EVORAH cobre
              </h2>
              <ul className="text-xs text-brand-textMuted space-y-2 leading-relaxed list-disc pl-4">
                <li>Oxidação, enferrujamento ou descascamento estrutural em peças de Aço Cirúrgico 316L.</li>
                <li>Defeitos de fabricação em fechos, elos ou cravações identificados no recebimento ou em até 90 dias (garantia legal do Art. 26 do CDC).</li>
                <li>Extravio logístico durante o transporte antes da confirmação de entrega (cobertura integral de reenvio ou estorno).</li>
              </ul>
            </div>

            <div className="pt-5 border-t border-brand-border">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-2">
                Cuidados e exceções
              </h2>
              <p className="text-xs text-brand-textMuted leading-relaxed">
                Para preservar o polimento espelhado, lave periodicamente com água morna e sabão neutro e seque com flanela macia. A garantia não cobre danos decorrentes de quedas, amassamentos por impacto, rompimento por tração forçada ou contato direto com produtos químicos abrasivos (como alvejantes e removedores industriais).
              </p>
            </div>

            <div className="pt-5 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.6} />
                <div className="text-xs">
                  <span className="font-semibold text-brand-text block">
                    Acionar Garantia pelo Concierge
                  </span>
                  <span className="text-brand-textMuted">
                    Envie o número do pedido e foto da peça para{' '}
                    <strong className="text-brand-text font-medium">atendimento@evorah.com.br</strong>
                  </span>
                </div>
              </div>
              <Link
                href="/rastreio"
                className="h-9 px-4 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Rastrear Pedido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <TrustSeals variant="checkout-panel" />
          </div>
        </div>
      </div>
    </div>
  );
}
