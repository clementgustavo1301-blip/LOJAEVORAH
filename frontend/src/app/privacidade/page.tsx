import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Database, FileCheck2, ArrowRight } from 'lucide-react';
import { TrustSeals } from '@/components/ui/trust-seals';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Segurança (LGPD)',
  description:
    'Política de Privacidade EVORAH EXPERIENCE em conformidade com a LGPD (Lei nº 13.709/2018), criptografia SSL 256-bit e proteção de pagamentos via Mercado Pago.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <div className="w-full bg-brand-background py-14 sm:py-20 px-6 sm:px-10 lg:px-12 flex-1">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="border-b border-brand-border pb-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            Conformidade LGPD • Lei nº 13.709/2018
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-text font-normal tracking-tight">
            Política de Privacidade e Segurança de Dados
          </h1>
          <p className="text-xs sm:text-sm text-brand-textMuted mt-3 max-w-2xl leading-relaxed">
            A EVORAH EXPERIENCE respeita integralmente a privacidade dos seus clientes e adota controles rígidos de criptografia e controle de acesso para proteger cada informação informada na loja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <Lock className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Criptografia SSL 256-bit
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Toda a comunicação entre seu dispositivo e nossos servidores trafega sob protocolo HTTPS com certificado SSL/TLS ativo, impedindo interceptações durante a navegação e o checkout.
            </p>
          </section>

          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Cartão Nunca Armazenado
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Os dados do seu cartão de crédito são tokenizados diretamente pelo gateway oficial Mercado Pago (PCI-DSS). Nossos servidores nunca armazenam número de cartão ou código CVV.
            </p>
          </section>

          <section className="bg-white border border-brand-border p-6 space-y-3">
            <span className="w-9 h-9 bg-brand-background border border-brand-border flex items-center justify-center">
              <Database className="w-4 h-4 text-brand-gold stroke-[1.6]" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Uso Estrito para Entrega
            </h2>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Nome, CPF, e-mail, telefone e endereço são utilizados exclusivamente para processamento antifraude, emissão da cobrança PIX/Cartão e despacho logístico do seu pedido.
            </p>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-brand-border p-7 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-2">
                Seus direitos como titular de dados (LGPD)
              </h2>
              <p className="text-xs text-brand-textMuted leading-relaxed">
                Em atendimento ao Art. 18 da LGPD, você pode solicitar a qualquer momento a confirmação da existência de tratamento, acesso aos dados, correção de informações desatualizadas ou exclusão de registros cadastrais não vinculados a obrigações fiscais legais.
              </p>
            </div>

            <div className="pt-5 border-t border-brand-border">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text mb-2">
                Encarregado de Dados (DPO) e Compartilhamento
              </h2>
              <p className="text-xs text-brand-textMuted leading-relaxed">
                Nunca comercializamos, alugamos ou cedemos sua base cadastral a terceiros para fins publicitários. O compartilhamento restringe-se apenas ao processador de pagamentos (Mercado Pago) e à transportadora responsável pela entrega. Contato com nosso Encarregado de Dados (DPO):{' '}
                <strong className="text-brand-text font-medium">contato@evorah.com.br</strong>.
              </p>
            </div>

            <div className="pt-5 border-t border-brand-border flex items-center justify-between gap-4">
              <Link
                href="/trocas-e-devolucoes"
                className="text-xs font-medium text-brand-text hover:text-brand-gold transition-colors underline underline-offset-4"
              >
                Política de Trocas e Devoluções
              </Link>
              <Link
                href="/produtos"
                className="h-9 px-4 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Explorar Joias</span>
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
