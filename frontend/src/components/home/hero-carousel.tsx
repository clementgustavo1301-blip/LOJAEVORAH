'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  imagePositionClass: string;
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'colecao-principal',
    image: '/images/hero-banner-1.webp',
    alt: 'Modelo usando corrente masculina com pingente de cruz dourada e pulseira em Aço 316L EVORAH',
    imagePositionClass: 'object-[76%_18%] md:object-right',
    eyebrow: 'Prata 925 & Aço Cirúrgico 316L',
    titlePrefix: 'Joias feitas para usar todo dia,',
    titleHighlight: 'sem perder o brilho.',
    subtitle:
      'Correntes, anéis e pulseiras à prova d\'água, suor e maresia. Hipoalergênicas e pensadas para acompanhar sua rotina.',
    primaryCta: {
      label: 'Ver coleção',
      href: '/produtos',
    },
    secondaryCta: {
      label: 'Mais vendidos',
      href: '/produtos?bestSeller=true',
    },
  },
  {
    id: 'correntes-pingentes',
    image: '/images/hero-banner-2.webp',
    alt: 'Correntes grumet dourada, venezianas em Prata 925 e pingente de cruz sobre pedra escura com gotas d\'água',
    imagePositionClass: 'object-[74%_42%] md:object-right',
    eyebrow: 'Linha Impermeável • Correntes & Pingentes',
    titlePrefix: 'Presença marcante do',
    titleHighlight: 'banho dourado ao aço.',
    subtitle:
      'Elos maciços e cruzes lapidadas em Aço 316L e Prata 925 legítima para usar no mar, piscina e treino sem oxidar.',
    primaryCta: {
      label: 'Ver correntes',
      href: '/produtos?category=correntes',
    },
    secondaryCta: {
      label: 'Ver pingentes',
      href: '/produtos?category=pingentes',
    },
  },
  {
    id: 'aneis-pulseiras',
    image: '/images/hero-banner-3.webp',
    alt: 'Mãos usando anel sinete em prata, aliança minimalista e pulseira grumet dourada sobre mármore escuro',
    imagePositionClass: 'object-[72%_44%] md:object-right',
    eyebrow: 'Anéis & Pulseiras • Frete Grátis',
    titlePrefix: 'Design arquitetônico em',
    titleHighlight: 'cada detalhe.',
    subtitle:
      'Sinetes escovados, anéis livres de níquel e braceletes com fecho de precisão e polimento espelhado.',
    primaryCta: {
      label: 'Ver anéis',
      href: '/produtos?category=aneis',
    },
    secondaryCta: {
      label: 'Ver pulseiras',
      href: '/produtos?category=pulseiras',
    },
  },
];

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = HERO_SLIDES.length;

  const goToSlide = useCallback(
    (index: number) => {
      setActiveIndex(((index % totalSlides) + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (isPaused || reducedMotion) return;
    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, reducedMotion, goNext]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setIsPaused(true);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    setIsPaused(false);
    if (startX === null || endX === undefined) return;
    const delta = startX - endX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta > 0) goNext();
      else goPrev();
    }
  };

  const currentSlide = HERO_SLIDES[activeIndex];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques da Coleção EVORAH"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[530px] sm:h-[560px] md:h-[530px] xl:h-[560px] bg-[#080808] text-white border-b border-white/10 overflow-hidden select-none focus:outline-none"
    >
      {/* Banners fotográficos full-bleed em camadas com transição cruzada */}
      <div className="absolute inset-0 bg-[#080808]" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out motion-reduce:transition-none ${
                isActive
                  ? 'opacity-100 scale-100 z-[1]'
                  : 'opacity-0 scale-[1.015] motion-reduce:scale-100 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                loading={index === 0 ? undefined : 'eager'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                sizes="100vw"
                className={`object-cover ${slide.imagePositionClass}`}
              />
            </div>
          );
        })}

        {/* Gradientes escuros direcionais apenas para leitura editorial e contraste dos controles */}
        <div className="hidden md:block absolute inset-0 z-[2] bg-gradient-to-r from-[#080808] via-[#080808]/68 via-[38%] to-transparent pointer-events-none" />
        <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 z-[2] bg-gradient-to-t from-[#080808]/75 to-transparent pointer-events-none" />
        <div className="md:hidden absolute inset-0 z-[2] bg-gradient-to-t from-[#080808] via-[#080808]/80 via-[44%] to-[#080808]/15 pointer-events-none" />
      </div>

      {/* Conteúdo editorial ancorado à esquerda */}
      <div className="relative z-10 w-full max-w-[1380px] h-full mx-auto px-4 sm:px-8 lg:px-12 flex items-end pb-14 sm:pb-14 md:pb-12">
        <div
          key={currentSlide.id}
          className="w-full md:max-w-[530px] lg:max-w-[570px] flex flex-col items-start justify-end animate-[fadeIn_0.45s_ease-out] motion-reduce:animate-none"
        >
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.24em] text-brand-gold mb-2.5 sm:mb-3">
            {currentSlide.eyebrow}
          </span>

          <h1 className="font-serif text-[29px] sm:text-4xl lg:text-[44px] xl:text-[48px] font-normal tracking-tight text-white leading-[1.12] pb-1 mb-2.5 sm:mb-3.5 max-w-[18ch] sm:max-w-none">
            {currentSlide.titlePrefix}{' '}
            <span className="italic font-light text-brand-gold">
              {currentSlide.titleHighlight}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-[44ch] mb-6 sm:mb-7">
            {currentSlide.subtitle}
          </p>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto">
            <Link
              href={currentSlide.primaryCta.href}
              prefetch={true}
              className="h-11 sm:h-12 px-3.5 sm:px-8 bg-brand-gold text-[#0A0A0A] hover:bg-white flex items-center justify-center gap-2 text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] whitespace-nowrap transition-colors shadow-md shadow-brand-gold/15"
            >
              <span>{currentSlide.primaryCta.label}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
            </Link>
            <Link
              href={currentSlide.secondaryCta.href}
              prefetch={true}
              className="h-11 sm:h-12 px-3.5 sm:px-8 bg-black/55 sm:bg-white/5 text-white border border-white/25 hover:border-brand-gold hover:text-brand-gold hover:bg-white/10 flex items-center justify-center text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.18em] whitespace-nowrap transition-colors"
            >
              {currentSlide.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Controles do carrossel (setas + indicadores arquitetônicos) */}
      <div className="absolute z-20 bottom-4 sm:bottom-5 md:bottom-11 inset-x-0 pointer-events-none">
        <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between md:justify-end gap-4">
          <div className="flex items-center gap-2 pointer-events-auto" role="tablist" aria-label="Selecionar banner">
            {HERO_SLIDES.map((slide, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Ir para o banner ${index + 1}: ${slide.eyebrow}`}
                  onClick={() => goToSlide(index)}
                  className="group py-2 px-0.5 flex items-center focus:outline-none"
                >
                  <span
                    className={`block h-[2px] transition-all duration-300 ${
                      isActive
                        ? 'w-9 sm:w-10 bg-brand-gold'
                        : 'w-5 sm:w-6 bg-white/30 group-hover:bg-white/65'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="hidden sm:inline-block text-[10px] font-mono tracking-[0.2em] text-white/55 mr-1 tabular-nums">
              0{activeIndex + 1} / 0{totalSlides}
            </span>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Banner anterior"
              className="w-8 h-8 sm:w-9 sm:h-9 border border-white/20 bg-black/50 hover:border-brand-gold hover:text-brand-gold text-white/85 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Próximo banner"
              className="w-8 h-8 sm:w-9 sm:h-9 border border-white/20 bg-black/50 hover:border-brand-gold hover:text-brand-gold text-white/85 flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
