'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { fetchProducts, getStoredProductsSnapshot } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { Product } from '@/types';
import { ProductCard } from '@/components/product/product-card';
import { ArrowRight, Cloud, Heart } from 'lucide-react';

export function AccountWishlistTab() {
  const { wishlist } = useCart();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    const stored = getStoredProductsSnapshot();
    if (stored.length > 0) setCatalog(stored);

    const missing = wishlist.some((id) => !stored.some((p) => p.id === id));
    if (missing || (wishlist.length > 0 && isSupabaseConfigured())) {
      let active = true;
      fetchProducts({ fresh: true }).then((remote) => {
        if (active) setCatalog(remote);
      });
      return () => {
        active = false;
      };
    }
  }, [wishlist]);

  const wishlistedProducts = catalog.filter((p) => wishlist.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            Curadoria Pessoal
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text mt-1">
            Favoritos
          </h2>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-textMuted">
          <Cloud className="w-3.5 h-3.5 text-brand-gold" />
          <span>Sincronizado na sua conta ({wishlistedProducts.length})</span>
        </span>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="bg-white border border-brand-border p-10 text-center space-y-4">
          <div className="w-10 h-10 bg-brand-background border border-brand-border flex items-center justify-center mx-auto text-brand-gold">
            <Heart className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl text-brand-text">
              Sua lista de desejos está vazia
            </h3>
            <p className="text-xs text-brand-textMuted max-w-sm mx-auto leading-relaxed">
              Toque no coração em qualquer joia da loja para salvá-la aqui e acessá-la em todos os seus dispositivos.
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex h-11 px-7 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] items-center gap-2 transition-colors"
          >
            <span>Explorar joias</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
