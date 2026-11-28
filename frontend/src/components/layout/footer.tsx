import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { FooterNewsletter } from '@/components/layout/footer-newsletter';
import { TrustSeals } from '@/components/ui/trust-seals';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-brand-border text-brand-textMuted">
      {/* Corpo Editorial do Rodapé */}
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 flex flex-col justify-between gap-8">
          <div>
            <Logo variant="horizontal" color="black" />
            <p className="text-xs text-brand-textMuted leading-relaxed max-w-sm mt-5">
              Joalheria contemporânea dedicada à precisão do Aço Cirúrgico 316L e da Prata 925. Peças desenhadas para presença diária sem perda de brilho.
            </p>
          </div>

          <div className="max-w-sm">
            <label
              htmlFor="footer-newsletter"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text block mb-3"
            >
              Lista Privada EVORAH
            </label>
            <FooterNewsletter />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text mb-4">
            Coleções
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-brand-textMuted">
            <li>
              <Link href="/produtos?category=correntes" className="hover:text-brand-text transition-colors">
                Correntes
              </Link>
            </li>
            <li>
              <Link href="/produtos?category=aneis" className="hover:text-brand-text transition-colors">
                Anéis
              </Link>
            </li>
            <li>
              <Link href="/produtos?category=pulseiras" className="hover:text-brand-text transition-colors">
                Pulseiras
              </Link>
            </li>
            <li>
              <Link href="/produtos?category=pingentes" className="hover:text-brand-text transition-colors">
                Pingentes
              </Link>
            </li>
            <li>
              <Link href="/produtos?category=cordoes" className="hover:text-brand-text transition-colors">
                Cordões
              </Link>
            </li>
            <li>
              <Link href="/produtos?category=brincos" className="hover:text-brand-text transition-colors">
                Brincos
              </Link>
            </li>
            <li>
              <Link href="/monte-seu-kit" className="text-brand-text font-medium hover:text-brand-gold transition-colors">
                Monte seu Kit
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text mb-4">
            Institucional & Garantias
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-brand-textMuted">
            <li>
              <Link href="/garantia" className="hover:text-brand-text transition-colors">
                Garantia Vitalícia
              </Link>
            </li>
            <li>
              <Link href="/trocas-e-devolucoes" className="hover:text-brand-text transition-colors">
                Trocas e Devoluções (CDC)
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-brand-text transition-colors">
                Privacidade e LGPD
              </Link>
            </li>
            <li>
              <Link
                href="/conta?aba=pedidos"
                className="text-brand-text font-medium hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
              >
                Minha Conta & Pedidos
              </Link>
            </li>
            <li>
              <Link
                href="/rastreio"
                className="text-brand-text font-medium hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
              >
                Rastrear Pedido
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text mb-4">
            Concierge & Suporte
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-brand-textMuted">
            <li>
              <span className="text-brand-text font-medium">Concierge:</span> atendimento@evorah.com.br
            </li>
            <li>
              <span className="text-brand-text font-medium">E-mail:</span> contato@evorah.com.br
            </li>
            <li>Seg. a Sex. • 09h às 18h (Brasília)</li>
          </ul>
        </div>
      </div>

      {/* Selos de Segurança SSL e Compra Garantida */}
      <TrustSeals variant="footer-band" />

      {/* Barra Inferior */}
      <div className="border-t border-brand-border py-5 px-6 sm:px-10 lg:px-12 text-[11px] text-brand-textMuted bg-brand-background">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {currentYear} EVORAH EXPERIENCE. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/produtos" className="hover:text-brand-text transition-colors">
              Catálogo
            </Link>
            <Link href="/garantia" className="hover:text-brand-text transition-colors">
              Garantia
            </Link>
            <Link href="/trocas-e-devolucoes" className="hover:text-brand-text transition-colors">
              Trocas (CDC)
            </Link>
            <Link href="/privacidade" className="hover:text-brand-text transition-colors">
              Privacidade
            </Link>
            <Link href="/rastreio" className="hover:text-brand-text transition-colors">
              Rastreio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
