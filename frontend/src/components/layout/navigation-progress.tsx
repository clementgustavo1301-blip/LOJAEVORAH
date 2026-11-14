'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const PREFETCH_ROUTES = [
  '/',
  '/produtos',
  '/produtos?category=aneis',
  '/produtos?category=correntes',
  '/produtos?bestSeller=true',
  '/produto/corrente-grumet-masculina-2mm',
  '/carrinho',
  '/favoritos',
  '/rastreio',
  '/checkout',
];
let warmedInSession = false;

function NavRouteReset({ onRouteSettled }: { onRouteSettled: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    onRouteSettled();
  }, [pathname, searchKey, onRouteSettled]);

  return null;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  const handleRouteSettled = useCallback(() => {
    setNavigating(false);
  }, []);

  // Pré-carrega rotas principais em background (dev e prod) para navegação instantânea
  useEffect(() => {
    if (warmedInSession) return;
    warmedInSession = true;

    let cancelled = false;
    let stepTimer: ReturnType<typeof setTimeout> | undefined;

    const warmQueue = PREFETCH_ROUTES.filter((r) => r !== pathname);
    let idx = 0;

    const warmNext = () => {
      if (cancelled || idx >= warmQueue.length) return;
      router.prefetch(warmQueue[idx++]);
      if (idx < warmQueue.length) {
        stepTimer = setTimeout(warmNext, 60);
      }
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmNext, { timeout: 600 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
        if (stepTimer) clearTimeout(stepTimer);
      };
    }

    stepTimer = setTimeout(warmNext, 200);
    return () => {
      cancelled = true;
      if (stepTimer) clearTimeout(stepTimer);
    };
  }, [pathname, router]);

  // Timeout de segurança para a barra nunca ficar presa em caso de cancelamento de rota
  useEffect(() => {
    if (!navigating) return;
    const safetyTimer = setTimeout(() => setNavigating(false), 4000);
    const onPopState = () => setNavigating(false);
    window.addEventListener('popstate', onPopState);
    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('popstate', onPopState);
    };
  }, [navigating]);

  // Prefetch sob demanda ao passar o ponteiro/tocar em qualquer link interno (ideal inclusive em dev)
  useEffect(() => {
    const prefetched = new Set<string>(PREFETCH_ROUTES);

    const prefetchTarget = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || prefetched.has(href)) return;
      prefetched.add(href);
      router.prefetch(href);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      if (event.target.closest('button, [role="button"], input, select, textarea')) {
        return;
      }

      const target = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || target.hasAttribute('download') || target.target === '_blank') return;

      try {
        const dest = new URL(target.href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        const current = `${window.location.pathname}${window.location.search}`;
        const next = `${dest.pathname}${dest.search}`;
        if (current !== next) {
          setNavigating(true);
        }
      } catch {
        // Ignore malformed URLs
      }
    };

    document.addEventListener('pointerover', prefetchTarget, { passive: true });
    document.addEventListener('touchstart', prefetchTarget, { passive: true });
    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('pointerover', prefetchTarget);
      document.removeEventListener('touchstart', prefetchTarget);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [router]);

  return (
    <>
      <Suspense fallback={null}>
        <NavRouteReset onRouteSettled={handleRouteSettled} />
      </Suspense>
      {navigating && (
        <div
          aria-hidden="true"
          className="fixed top-0 inset-x-0 z-[100] h-[2px] bg-brand-gold/25 overflow-hidden pointer-events-none"
        >
          <div className="h-full w-1/2 bg-brand-gold animate-[pulse_0.9s_ease-in-out_infinite] origin-left" />
        </div>
      )}
    </>
  );
}
