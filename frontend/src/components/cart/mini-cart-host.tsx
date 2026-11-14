'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/cart-context';

const LazyMiniCartDrawer = dynamic(
  () => import('./mini-cart-drawer').then((mod) => mod.MiniCartDrawer),
  { ssr: false }
);

export function MiniCartHost() {
  const pathname = usePathname();
  const { isMiniCartOpen, setIsMiniCartOpen, totalCount } = useCart();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (pathname === '/checkout' && isMiniCartOpen) {
      setIsMiniCartOpen(false);
    }
  }, [pathname, isMiniCartOpen, setIsMiniCartOpen]);

  useEffect(() => {
    if (pathname !== '/checkout' && isMiniCartOpen && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [pathname, isMiniCartOpen, shouldLoad]);

  // Pré-carrega em idle caso já existam itens na sacola salvos em localStorage
  useEffect(() => {
    if (shouldLoad || totalCount === 0) return;
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setShouldLoad(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setShouldLoad(true), 1200);
    return () => clearTimeout(t);
  }, [shouldLoad, totalCount]);

  if (!shouldLoad) return null;
  return <LazyMiniCartDrawer />;
}

