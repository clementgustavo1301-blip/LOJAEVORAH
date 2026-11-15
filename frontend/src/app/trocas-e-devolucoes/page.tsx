import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { TrustSeals } from '@/components/ui/trust-seals';

export const metadata: Metadata = {
  title: 'Política de Trocas e Devoluções',
  description:
    'Política oficial de trocas e devoluções EVORAH EXPERIENCE conforme o Código de Defesa do Consumidor (Art. 49 CDC - 7 dias) e primeira troca gratuita em até 30 dias.',
  alternates: { canonical: '/trocas-e-devolucoes' },
};

export default function TrocasEDevolucoesPage() {
  return (
    <div className="w-full bg-brand-background py-14 sm:py-20 px-6 sm:px-10 lg:px-12 flex-1">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="border-b border-brand-border pb-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            Transparência & Código de Defesa do Consumidor
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-text font-normal tracking-tight">
            Trocas, Devoluções e Direito de Arrependimento
          </h1>
          <p className="text-xs sm:text-sm text-brand-textMuted mt-3 max-w-2xl leading-relaxed">
            Sua compra na EVORAH EXPERIENCE é 100% protegida. Se o tamanho não servir ou você mudar de ideia, garantimos processo simples, sem burocracia e em total conformidade com a legislação brasileira.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              7 Dias • Direito de Arrependimento
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Conforme o Art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990), você tem até 7 dias corridos após o recebimento para desistir da compra e receber reembolso integral, incluindo frete.
            </p>
          </section>

          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              30 Dias • Primeira Troca Gratuita
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Caso queira ajustar o comprimento da corrente, aro do anel ou escolher outro modelo, oferecemos até 30 dias corridos após a entrega com etiqueta de logística reversa gratuita na primeira troca.
            </p>
          </section>

          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Reembolso Garantido
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Pagamentos via PIX são estornados em até 24 horas úteis após a conferência da postagem. Compras no cartão têm cancelamento solicitado imediatamente junto ao Mercado Pago.
            </p>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-brand-border p-7 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-3">
                Como solicitar troca ou devolução em 3 passos
              </h2>
              <ol className="text-xs text-brand-textMuted space-y-2.5 leading-relaxed list-decimal pl-4">
                <li>
                  Envie um e-mail para{' '}
                  <strong className="text-brand-text font-medium">atendimento@evorah.com.br</strong>{' '}
                  informando o número do pedido (<code className="text-[11px] bg-brand-background px-1">INX-...</code>) e o motivo da solicitação.
                </li>
                <li>
                  Nossa equipe de Concierge emitirá o código de postagem reversa sem custo em até 1 dia útil.
                </li>
                <li>
                  Envie a peça na embalagem original sem sinais de mau uso. Assim que a postagem for confirmada ou conferida, liberamos a nova peça ou o estorno integral.
                </li>
              </ol>
            </div>

            <div className="pt-5 border-t border-brand-border flex items-center justify-between gap-4">
              <Link
                href="/garantia"
                className="text-xs font-medium text-brand-text hover:text-brand-gold transition-colors underline underline-offset-4"
              >
                Consultar Garantia Vitalícia
              </Link>
              <Link
                href="/produtos"
                className="h-9 px-4 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Voltar ao Catálogo</span>
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
