'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroBannerSlide {
  id: string;
  href: string;
  image: string;
  alt: string;
  imagePositionClass: string;
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
}

const HERO_BANNERS: HeroBannerSlide[] = [
  {
    id: 'classicos-evorah',
    href: '/produtos?bestSeller=true',
    image: '/images/hero-banner-1.webp',
    alt: 'Modelo usando camisa preta fechada, corrente masculina com pingente de cruz dourada e pulseira em Aço 316L EVORAH',
    imagePositionClass: 'object-[76%_24%] md:object-[100%_56%]',
    eyebrow: 'Mais Vendidos • Prata 925 & Aço 316L',
    titlePrefix: 'Joias feitas para usar todo dia,',
    titleHighlight: 'sem perder o brilho.',
    subtitle:
      'Correntes, anéis e pulseiras à prova d\'água, suor e maresia com acabamento clássico em dourado e prata.',
  },
  {
    id: 'final-de-ano',
    href: '/produtos',
    image: '/images/hero-final-ano.webp',
    alt: 'Corrente grumet dourada, anel sinete escovado e pulseira em Prata 925 em edição especial de Final de Ano EVORAH',
    imagePositionClass: 'object-[74%_44%] md:object-right',
    eyebrow: 'Oferta de Final de Ano • Frete Grátis',
    titlePrefix: 'Brilho permanente para',
    titleHighlight: 'celebrar o fim de ano.',
    subtitle:
      'Especial de Final de Ano EVORAH: correntes, anéis e pulseiras em Prata 925 e Aço Cirúrgico 316L à prova d\'água com frete grátis em todas as compras.',
  },
  {
    id: 'correntes-pingentes',
    href: '/produtos?category=correntes',
    image: '/images/hero-banner-2.webp',
    alt: 'Correntes grumet dourada, venezianas em Prata 925 e pingente de cruz sobre pedra escura',
    imagePositionClass: 'object-[74%_42%] md:object-right',
    eyebrow: 'Linha Impermeável • Correntes & Pingentes',
    titlePrefix: 'Presença marcante do',
    titleHighlight: 'banho dourado ao aço.',
    subtitle:
      'Elos maciços e cruzes lapidadas em Aço 316L e Prata 925 resistentes ao mar, piscina e treino sem oxidar.',
  },
  {
    id: 'aneis-pulseiras',
    href: '/produtos?category=aneis',
    image: '/images/hero-banner-3.webp',
    alt: 'Mãos usando anel sinete em prata e pulseira grumet dourada sobre mármore escuro',
    imagePositionClass: 'object-[72%_44%] md:object-right',
    eyebrow: 'Anéis & Pulseiras • Frete Grátis',
    titlePrefix: 'Design arquitetônico em',
    titleHighlight: 'cada detalhe.',
    subtitle:
      'Sinetes escovados, anéis livres de níquel e braceletes com fecho de precisão e polimento espelhado.',
  },
];

const ROTATION_INTERVAL_MS = 4000;

/** Banners principais rotativos a cada 4 segundos, sem botões, setas ou indicadores. */
export function HeroRotatingBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener('change', syncPreference);
    return () => media.removeEventListener('change', syncPreference);
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_BANNERS.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, reducedMotion]);

  const currentBanner = HERO_BANNERS[activeIndex];

  return (
    <section
      aria-label="Destaques e Oferta de Final de Ano EVORAH"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className="w-full bg-[#080808] border-b border-white/10"
    >
      <Link
        href={currentBanner.href}
        prefetch={true}
        aria-label={`${currentBanner.eyebrow}: ${currentBanner.titlePrefix} ${currentBanner.titleHighlight}`}
        className="group relative block w-full h-[500px] sm:h-[530px] md:h-[520px] xl:h-[550px] bg-[#080808] text-white overflow-hidden select-none"
      >
        {/* Imagens full-bleed sobrepostas com troca cruzada automática a cada 4s */}
        <div className="absolute inset-0 bg-[#080808]" aria-hidden="true">
          {HERO_BANNERS.map((banner, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                  isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : 'eager'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes="100vw"
                  className={`object-cover ${banner.imagePositionClass}`}
                />
              </div>
            );
          })}

          <div className="hidden md:block absolute inset-0 z-[2] bg-gradient-to-r from-[#080808] via-[#080808]/68 via-[40%] to-transparent pointer-events-none" />
          <div className="md:hidden absolute inset-0 z-[2] bg-gradient-to-t from-[#080808] via-[#080808]/78 via-[46%] to-[#080808]/15 pointer-events-none" />
        </div>

        {/* Chamada editorial do banner ativo (sem botões) */}
        <div className="relative z-10 w-full max-w-[1380px] h-full mx-auto px-4 sm:px-8 lg:px-12 flex items-end pb-9 sm:pb-12 lg:pb-14">
          <div
            key={currentBanner.id}
            className="w-full md:max-w-[540px] lg:max-w-[590px] flex flex-col items-start justify-end animate-[fadeIn_0.45s_ease-out] motion-reduce:animate-none"
          >
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.24em] text-brand-gold mb-2.5 sm:mb-3">
              {currentBanner.eyebrow}
            </span>

            <h1 className="font-serif text-[30px] sm:text-4xl lg:text-[46px] xl:text-[50px] font-normal tracking-tight text-white leading-[1.12] pb-1 mb-3 max-w-[18ch] sm:max-w-none">
              {currentBanner.titlePrefix}{' '}
              <span className="italic font-light text-brand-gold">
                {currentBanner.titleHighlight}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-[44ch]">
              {currentBanner.subtitle}
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
