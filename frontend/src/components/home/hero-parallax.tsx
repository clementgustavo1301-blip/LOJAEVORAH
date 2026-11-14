'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HERO_MODEL_BLUR_DATA_URL } from '@/lib/media-placeholders';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function HeroParallax() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const glowLayerRef = useRef<HTMLDivElement>(null);
  const modelLayerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const video = videoRef.current;

    let idleHandle: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    if (video && !prefersReducedMotion) {
      const startVideo = () => {
        video.defaultMuted = true;
        video.muted = true;
        if (video.paused) {
          video.play().catch(() => {
            // Autoplay pode ser bloqueado por economia de bateria do navegador
          });
        }
      };

      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(startVideo, { timeout: 600 });
      } else {
        fallbackTimer = setTimeout(startVideo, 120);
      }
    }

    if (prefersReducedMotion) {
      return () => {
        if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleHandle);
        }
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }

    let rafId = 0;

    const applyParallax = () => {
      rafId = 0;
      const y = window.scrollY;
      const p560 = clamp01(y / 560);
      const p520 = clamp01(y / 520);
      const p460 = clamp01(y / 460);

      if (videoLayerRef.current) {
        videoLayerRef.current.style.transform = `translate3d(0, ${(p560 * 95).toFixed(2)}px, 0) scale(${(1 + p560 * 0.06).toFixed(4)})`;
      }
      if (glowLayerRef.current) {
        glowLayerRef.current.style.transform = `translate3d(0, ${(p560 * 95).toFixed(2)}px, 0)`;
        glowLayerRef.current.style.opacity = (1 - p520 * 0.72).toFixed(3);
      }
      if (modelLayerRef.current) {
        modelLayerRef.current.style.transform = `translate3d(0, ${(p560 * 68).toFixed(2)}px, 0)`;
      }
      if (textLayerRef.current) {
        textLayerRef.current.style.transform = `translate3d(0, ${(p560 * 40).toFixed(2)}px, 0)`;
        textLayerRef.current.style.opacity = (1 - p460 * 0.8).toFixed(3);
      }
    };

    const onScroll = () => {
      if (!rafId && window.scrollY <= 620) {
        rafId = window.requestAnimationFrame(applyParallax);
      } else if (!rafId) {
        rafId = window.requestAnimationFrame(applyParallax);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section
      className="relative w-full h-[470px] sm:h-[500px] lg:h-[530px] xl:h-[550px] bg-[#000000] text-white border-b border-white/10 overflow-hidden select-none"
      aria-label="Destaque da Coleção EVORAH"
    >
      {/* 1. CAMADA SUPERIOR: VÍDEO EVORAH POSICIONADO NO TOPO (WebM VP9 + MP4 Faststart) */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-[4] mix-blend-screen">
        <div className="w-full max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-12">
          <div
            ref={videoLayerRef}
            className="w-[116%] -ml-[8%] sm:w-full sm:ml-0 md:w-[calc(100%-330px)] max-w-[900px] will-change-transform origin-top"
          >
            <div
              className="w-full aspect-video -translate-y-[20%]"
              style={{
                WebkitMaskImage:
                  'radial-gradient(ellipse 84% 58% at 50% 50%, #000 62%, transparent 98%)',
                maskImage:
                  'radial-gradient(ellipse 84% 58% at 50% 50%, #000 62%, transparent 98%)',
              }}
            >
              <video
                ref={videoRef}
                poster="/brand/evorah-hero-poster.webp"
                loop
                muted
                playsInline
                preload="metadata"
                disablePictureInPicture
                disableRemotePlayback
                aria-hidden="true"
                className="w-full h-full object-contain opacity-[0.36]"
              >
                <source src="/brand/evorah-hero.webm" type="video/webm" />
                <source src="/brand/evorah-hero.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        {/* Véu atmosférico sutil mantendo a animação discreta e mais apagada de fundo */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#000000]/55 via-[#000000]/18 via-38% to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* 2. GLOW AMBIENTE DOURADO ATRÁS DO MODELO (camada de parallax via scroll) */}
      <div
        ref={glowLayerRef}
        className="absolute right-0 inset-y-0 w-[460px] lg:w-[600px] flex items-center pointer-events-none z-[1] will-change-transform"
        aria-hidden="true"
      >
        <div className="w-full h-[460px] lg:h-[600px] bg-[radial-gradient(circle_at_center,rgba(201,164,82,0.16)_0%,transparent_65%)]" />
      </div>

      {/* Gradiente sutil inferior para transição contínua com a seção seguinte */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-[3]"
        aria-hidden="true"
      />

      {/*
        3. MODELO — foto inteira visível (object-contain) em mobile e desktop com parallax suave.
        Mantém topo e lateral direita rentes às bordas iniciais sem expor recortes.
      */}
      <div
        ref={modelLayerRef}
        className="block absolute top-0 right-0 h-[78%] sm:h-[90%] md:h-full aspect-[1027/1531] opacity-85 sm:opacity-95 md:opacity-100 pointer-events-none z-10 will-change-transform"
      >
        <Image
          src="/images/hero-model-clean.webp"
          alt="Modelo masculino usando corrente com pingente de cruz dourada e pulseira EVORAH"
          fill
          priority
          fetchPriority="high"
          placeholder="blur"
          blurDataURL={HERO_MODEL_BLUR_DATA_URL}
          sizes="(max-width: 768px) 260px, 380px"
          className="object-contain object-right-top"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/55 via-35% to-transparent md:hidden"
          aria-hidden="true"
        />
      </div>

      {/* 4. CONTEÚDO EDITORIAL (MOBILE-FIRST ANCORADO NA BASE ESQUERDA) */}
      <div className="relative z-20 w-full max-w-[1380px] h-full mx-auto px-4 sm:px-8 lg:px-12 flex items-end pb-7 sm:pb-10 lg:pb-12">
        <div
          ref={textLayerRef}
          className="w-full md:max-w-[calc(100%-360px)] lg:max-w-[560px] xl:max-w-[600px] flex flex-col items-start justify-end will-change-transform"
        >
          {/* Título Principal de Alto Impacto */}
          <h1 className="font-serif text-[28px] sm:text-4xl lg:text-[44px] xl:text-[48px] font-normal tracking-tight text-white leading-[1.1] mb-3 sm:mb-4 max-w-[18ch] sm:max-w-none">
            Joias feitas para usar todo dia,{' '}
            <span className="italic font-light text-brand-gold">
              sem perder o brilho.
            </span>
          </h1>

          {/* Subtítulo idêntico ao referencial visual */}
          <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-[42ch] mb-6 sm:mb-8">
            Correntes, anéis e pulseiras à prova d&apos;água, suor e maresia. Confeccionadas em Prata 925 legítima e Aço Cirúrgico hipoalergênico.
          </p>

          {/* Ações Mobile-First (2 colunas de toque fácil no mobile, inline no desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto">
            <Link
              href="/produtos"
              prefetch={true}
              className="h-11 sm:h-12 px-4 sm:px-8 bg-brand-gold text-[#0A0A0A] hover:bg-white flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] transition-all shadow-md shadow-brand-gold/15"
            >
              <span>Ver produtos</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
            </Link>
            <Link
              href="/produtos?bestSeller=true"
              prefetch={true}
              className="h-11 sm:h-12 px-4 sm:px-8 bg-black/50 sm:bg-white/5 text-white border border-white/25 hover:border-brand-gold hover:text-brand-gold hover:bg-white/10 flex items-center justify-center text-[11px] font-medium uppercase tracking-[0.16em] sm:tracking-[0.18em] transition-all"
            >
              Mais vendidos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
