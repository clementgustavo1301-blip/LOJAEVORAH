import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { HeroParallax } from '@/components/home/hero-parallax';
import { CategoryIcon, CategoryIconName } from '@/components/home/category-icons';
import { EDITORIAL_HAND_BLUR_DATA_URL } from '@/lib/media-placeholders';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const CATEGORIES: { name: string; slug: CategoryIconName }[] = [
  { name: 'Correntes', slug: 'correntes' },
  { name: 'Anéis', slug: 'aneis' },
  { name: 'Pulseiras', slug: 'pulseiras' },
  { name: 'Pingentes', slug: 'pingentes' },
  { name: 'Cordões', slug: 'cordoes' },
  { name: 'Brincos', slug: 'brincos' },
];

export default async function HomePage() {
  const allProducts = await fetchProducts();
  const bestSellers = allProducts.filter((p) => p.isBestSeller).slice(0, 4);
  const newArrivals = allProducts.slice(0, 4);

  return (
    <div className="flex flex-col w-full bg-brand-background text-brand-text">
      {/* 1. Hero Section: Horizontal Panorâmico com Vídeo de Fundo + Modelo Clean + Parallax */}
      <HeroParallax />

      {/* 2. Pilares Arquitetônicos */}
      <section className="border-b border-brand-border bg-white px-6 sm:px-10 lg:px-12 py-7">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 divide-y sm:divide-y-0 sm:divide-x divide-brand-border">
          <div className="sm:pr-8 pt-3 sm:pt-0 first:pt-0">
            <span className="text-[10px] font-mono text-brand-gold tracking-[0.2em] block mb-1">
              01
            </span>
            <h2 className="text-xs font-semibold text-brand-text uppercase tracking-[0.16em]">
              À prova d&apos;água
            </h2>
            <p className="text-xs text-brand-textMuted mt-1 leading-relaxed">
              Use no mar, piscina e rotina intensa sem escurecer ou perder o polimento.
            </p>
          </div>

          <div className="sm:pl-8 pt-5 sm:pt-0">
            <span className="text-[10px] font-mono text-brand-gold tracking-[0.2em] block mb-1">
              02
            </span>
            <h2 className="text-xs font-semibold text-brand-text uppercase tracking-[0.16em]">
              Hipoalergênico
            </h2>
            <p className="text-xs text-brand-textMuted mt-1 leading-relaxed">
              Aço cirúrgico 316L e Prata 925 livres de níquel reativo, gentis com a pele.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Categorias */}
      <section className="py-14 sm:py-18 px-6 sm:px-10 lg:px-12 border-b border-brand-border bg-brand-background">
        <div className="max-w-[1380px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text tracking-tight">
                Categorias
              </h2>
            </div>
            <Link
              href="/produtos"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text hover:text-brand-gold flex items-center gap-2 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/produtos?category=${cat.slug}`}
                className="group flex flex-col items-center gap-4 py-7 sm:py-8 bg-white border border-brand-border hover:border-brand-text transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-text"
              >
                <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border border-brand-border flex items-center justify-center text-brand-gold transition-colors duration-300 group-hover:bg-[#0A0A0A] group-hover:border-[#0A0A0A]">
                  <CategoryIcon
                    name={cat.slug}
                    className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110"
                  />
                </span>
                <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-brand-text group-hover:text-brand-gold transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Mais Vendidos */}
      <section className="offscreen-section py-14 sm:py-20 px-6 sm:px-10 lg:px-12 border-b border-brand-border bg-white">
        <div className="max-w-[1380px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-1">
                Seleção Essencial
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text tracking-tight">
                Peças Mais Desejadas
              </h2>
            </div>
            <Link
              href="/produtos?bestSeller=true"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text hover:text-brand-gold flex items-center gap-2 transition-colors"
            >
              <span>Ver seleção</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-7">
            {bestSellers.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Manifesto & Artesania EVORAH */}
      <section className="offscreen-section w-full bg-[#000000] text-white border-b border-white/10 py-16 sm:py-24 px-6 sm:px-10 lg:px-12 overflow-hidden">
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative aspect-[16/11] bg-white/5 border border-white/10 overflow-hidden">
            <Image
              src="/images/editorial-hand.webp"
              alt="Detalhe de joias artesanais EVORAH em Aço Cirúrgico e Prata 925"
              fill
              placeholder="blur"
              blurDataURL={EDITORIAL_HAND_BLUR_DATA_URL}
              sizes="(max-width: 1024px) 100vw, 680px"
              className="object-cover object-center"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-[10px] font-semibold text-brand-gold tracking-[0.22em] uppercase mb-4">
              Atelier EVORAH Experience
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-[1.12] mb-6">
              O brilho que resiste ao tempo e aos elementos.
            </h2>
            <p className="text-sm text-white/70 font-light leading-relaxed max-w-[48ch] mb-8">
              Cada elo e cada face de nossas peças são concebidos para acompanhar seu ritmo diário. No mar, no treino ou nos momentos marcantes, a EVORAH entrega pureza estrutural e durabilidade inalterável.
            </p>
            <Link
              href="/produtos"
              className="h-11 px-7 bg-brand-gold text-[#0A0A0A] hover:bg-white inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
            >
              <span>Conhecer a coleção</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Lançamentos */}
      <section className="offscreen-section py-14 sm:py-20 px-6 sm:px-10 lg:px-12 bg-white">
        <div className="max-w-[1380px] mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text tracking-tight">
                Lançamentos Recentes
              </h2>
            </div>
            <Link
              href="/produtos?isNew=true"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text hover:text-brand-gold flex items-center gap-2 transition-colors"
            >
              <span>Ver lançamentos</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-7">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
