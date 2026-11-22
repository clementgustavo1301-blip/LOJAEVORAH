import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CollectionBanner {
  id: string;
  href: string;
  image: string;
  alt: string;
  imagePositionClass: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

const COLLECTION_BANNERS: CollectionBanner[] = [
  {
    id: 'classicos-mais-vendidos',
    href: '/produtos?bestSeller=true',
    image: '/images/hero-banner-1.webp',
    alt: 'Modelo usando corrente com pingente de cruz dourada e pulseira em Aço 316L EVORAH',
    imagePositionClass: 'object-[78%_20%]',
    eyebrow: 'Mais Vendidos',
    title: 'Clássicos EVORAH',
    subtitle: 'Correntes e pulseiras essenciais em Aço 316L.',
  },
  {
    id: 'correntes-pingentes',
    href: '/produtos?category=correntes',
    image: '/images/hero-banner-2.webp',
    alt: 'Correntes grumet dourada, venezianas em Prata 925 e pingente de cruz sobre pedra escura',
    imagePositionClass: 'object-[76%_44%]',
    eyebrow: 'Correntes & Pingentes',
    title: 'Banho Dourado & Prata',
    subtitle: 'Peças impermeáveis para mar, piscina e rotina.',
  },
  {
    id: 'aneis-pulseiras',
    href: '/produtos?category=aneis',
    image: '/images/hero-banner-3.webp',
    alt: 'Mãos usando anel sinete em prata e pulseira grumet dourada sobre mármore escuro',
    imagePositionClass: 'object-[74%_44%]',
    eyebrow: 'Anéis & Pulseiras',
    title: 'Design Arquitetônico',
    subtitle: 'Sinetes maciços e braceletes de brilho contínuo.',
  },
];

/** Hero estático principal — Oferta de Final de Ano sem botões, clicável por inteiro. */
export function HeroStaticBanner() {
  return (
    <section aria-label="Oferta de Final de Ano EVORAH" className="w-full bg-[#080808] border-b border-white/10">
      <Link
        href="/produtos"
        prefetch={true}
        aria-label="Oferta de Final de Ano EVORAH: frete grátis em todas as compras. Explorar catálogo."
        className="group relative block w-full h-[460px] sm:h-[500px] md:h-[510px] xl:h-[540px] bg-[#080808] text-white overflow-hidden select-none"
      >
        <Image
          src="/images/hero-final-ano.webp"
          alt="Corrente grumet dourada, anel sinete escovado e pulseira em Prata 925 em edição especial de Final de Ano EVORAH"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[74%_44%] md:object-right transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
        />

        {/* Gradientes escuros direcionais apenas para leitura editorial, sem halos */}
        <div
          className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/68 via-[40%] to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="md:hidden absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/78 via-[46%] to-[#080808]/15 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-[1380px] h-full mx-auto px-4 sm:px-8 lg:px-12 flex items-end pb-9 sm:pb-12 lg:pb-14">
          <div className="w-full md:max-w-[540px] lg:max-w-[590px] flex flex-col items-start justify-end">
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.24em] text-brand-gold mb-2.5 sm:mb-3">
              Oferta de Final de Ano • Frete Grátis
            </span>

            <h1 className="font-serif text-[30px] sm:text-4xl lg:text-[46px] xl:text-[50px] font-normal tracking-tight text-white leading-[1.12] pb-1 mb-3 max-w-[18ch] sm:max-w-none">
              Brilho permanente para{' '}
              <span className="italic font-light text-brand-gold">
                celebrar o fim de ano.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-[44ch]">
              Especial de Final de Ano EVORAH: correntes, anéis e pulseiras em Prata 925 e Aço Cirúrgico 316L à prova d&apos;água com frete grátis em todas as compras.
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}

/** Grade estática com os 3 banners das coleções logo abaixo do Hero (clicáveis, sem botões). */
export function CollectionBannersGrid() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="w-full bg-[#0E0E0E] border-b border-brand-border py-4 sm:py-5 px-4 sm:px-8 lg:px-12"
    >
      <div className="max-w-[1380px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {COLLECTION_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            prefetch={true}
            className="group relative block h-[185px] sm:h-[205px] lg:h-[220px] bg-[#080808] border border-white/10 hover:border-brand-gold/55 overflow-hidden transition-colors"
          >
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              loading="eager"
              sizes="(max-width: 767px) 100vw, 33vw"
              className={`object-cover ${banner.imagePositionClass} transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none`}
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/82 via-[55%] to-transparent pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6 max-w-[64%] sm:max-w-[60%]">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-gold mb-1.5">
                {banner.eyebrow}
              </span>
              <h2 className="font-serif text-[21px] sm:text-[22px] lg:text-2xl font-normal text-white leading-[1.15] group-hover:text-brand-gold transition-colors">
                {banner.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-white/75 font-light mt-1.5 leading-snug">
                {banner.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
