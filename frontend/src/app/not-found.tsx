import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="w-full min-h-[70vh] bg-brand-background flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold mb-2 block">
        Erro 404 • Página Não Encontrada
      </span>
      <h1 className="text-3xl sm:text-4xl font-serif font-normal text-brand-text mb-3">
        Peça ou endereço inexistente
      </h1>
      <p className="text-xs text-brand-textMuted max-w-sm mb-8 leading-relaxed font-light">
        A página que você está procurando pode ter sido removida ou não está disponível no acervo atual.
      </p>
      <Link
        href="/produtos"
        className="h-11 px-7 bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A] font-semibold text-[11px] uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
      >
        <span>Voltar ao acervo</span>
        <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
      </Link>
    </div>
  );
}
