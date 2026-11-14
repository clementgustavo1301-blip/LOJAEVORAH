'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { useCart } from '@/context/cart-context';
import { Search, Heart, ShoppingBag, Menu, X, ArrowRight } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount, wishlist, setIsMiniCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reordenado exatamente de acordo com o referencial de layout
  const categories = [
    { name: 'Anéis', href: '/produtos?category=aneis' },
    { name: 'Correntes', href: '/produtos?category=correntes' },
    { name: 'Cordões', href: '/produtos?category=cordoes' },
    { name: 'Pingentes', href: '/produtos?category=pingentes' },
    { name: 'Pulseiras', href: '/produtos?category=pulseiras' },
    { name: 'Brincos', href: '/produtos?category=brincos' },
    { name: 'Mais Vendidos', href: '/produtos?bestSeller=true', highlight: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-brand-border select-none">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 lg:gap-4 xl:gap-6">
          {/* Esquerda: Menu mobile + Logo Oficial EVORAH EXPERIENCE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-brand-text hover:text-brand-gold p-2 -ml-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-text"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>

            <Logo
              variant="horizontal"
              color="gold"
              className="[&_svg]:h-8 lg:[&_svg]:h-8 xl:[&_svg]:h-10"
            />
          </div>

          {/* Centro: Navegação Editorial Exata */}
          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-7 h-full min-w-0"
            aria-label="Navegação principal"
          >
            {categories.map((cat) => {
              const isActive = pathname === cat.href;
              return (
                <Link
                  key={cat.name}
                  href={cat.href}
                  prefetch={true}
                  className={`relative text-[10.5px] xl:text-[11px] uppercase tracking-[0.12em] xl:tracking-[0.16em] py-2 transition-colors whitespace-nowrap ${
                    cat.highlight
                      ? 'font-semibold text-brand-text hover:text-brand-gold'
                      : isActive
                      ? 'font-semibold text-brand-text'
                      : 'text-brand-textMuted hover:text-brand-text font-medium'
                  }`}
                >
                  {cat.name}
                  {cat.highlight && (
                    <span className="block h-[1px] w-full bg-brand-gold mt-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Direita: Busca, Favoritos e Botão Sacola [ 🛍️ 0 ] */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="text-brand-text hover:text-brand-gold p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-text"
              aria-label="Buscar joias"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </button>

            <Link
              href="/favoritos"
              prefetch={true}
              className="relative text-brand-text hover:text-brand-gold p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-text"
              aria-label="Lista de desejos"
            >
              <Heart className="w-4 h-4 stroke-[1.75]" />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1 w-3.5 h-3.5 bg-brand-gold text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Botão de Sacola idêntico ao referencial visual: Caixa preta de alto contraste */}
            <button
              type="button"
              onClick={() => setIsMiniCartOpen(true)}
              className="h-9 px-3 sm:px-3.5 bg-[#000000] text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              aria-label="Abrir sacola de compras"
            >
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.75]" />
              <span className="font-sans text-xs font-semibold tabular-nums">{totalCount}</span>
            </button>
          </div>
        </div>

        {/* Barra Rápida de Categorias Mobile-First (1 toque no polegar sem abrir gaveta) */}
        <nav
          aria-label="Categorias rápidas mobile"
          className="lg:hidden border-t border-brand-border/60 bg-white/95 px-4 py-2 overflow-x-auto flex items-center gap-2 no-scrollbar"
        >
          <Link
            href="/produtos"
            prefetch={true}
            className="shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold border border-brand-border bg-brand-background text-brand-text active:bg-[#0A0A0A] active:text-white transition-colors"
          >
            Acervo
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              prefetch={true}
              className={`shrink-0 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] border transition-colors ${
                cat.highlight
                  ? 'border-brand-gold/60 bg-[#0A0A0A] text-brand-gold font-semibold'
                  : 'border-brand-border bg-white text-brand-textMuted hover:text-brand-text font-medium'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* Modal de Busca Minimalista */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
          <div className="bg-white border border-brand-border w-full max-w-xl p-6 sm:p-8 relative shadow-luxury text-brand-text animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-6">
              <span className="text-xs uppercase tracking-[0.16em] font-semibold text-brand-gold">
                Acervo EVORAH
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-brand-textMuted hover:text-brand-text p-1 transition-colors"
                aria-label="Fechar busca"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setSearchOpen(false);
                  router.push(
                    `/produtos?search=${encodeURIComponent(searchQuery.trim())}`
                  );
                }
              }}
              className="flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-brand-textMuted stroke-[1.5] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por anel, corrente, bracelete..."
                className="w-full text-base sm:text-lg bg-transparent border-none focus:outline-none placeholder:text-brand-textMuted/60 font-light"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A] text-xs uppercase tracking-[0.14em] font-medium transition-colors"
              >
                Buscar
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-border">
              <span className="text-[10px] uppercase tracking-[0.18em] text-brand-textMuted block mb-3 font-mono">
                Termos Mais Buscados
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Corrente Grumet',
                  'Pingente Cruz',
                  'Anel Minimalista',
                  'Bracelete Inox',
                  'Prata 925',
                ].map((term) => (
                  <Link
                    key={term}
                    href={`/produtos?search=${encodeURIComponent(term)}`}
                    onClick={() => setSearchOpen(false)}
                    className="text-xs px-3 py-1.5 bg-brand-surface border border-brand-border hover:border-brand-text text-brand-text transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gaveta Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white border-r border-brand-border p-6 flex flex-col justify-between shadow-2xl animate-slideRight">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-brand-border mb-6">
                <Logo variant="horizontal" color="gold" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-brand-text hover:text-brand-gold p-1"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <nav className="flex flex-col space-y-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs uppercase tracking-[0.18em] font-medium text-brand-text hover:text-brand-gold py-2 border-b border-brand-border/40 flex items-center justify-between"
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-textMuted stroke-[1.5]" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-brand-border text-[11px] text-brand-textMuted">
              <p className="font-serif italic text-sm text-brand-text mb-1">
                EVORAH Experience
              </p>
              <p>Joias de alta permanência em Prata 925 & Aço Cirúrgico 316L.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
