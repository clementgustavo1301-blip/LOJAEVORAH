'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { FALLBACK_PRODUCTS, fetchProducts, getStoredProductsSnapshot } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ProductCard } from '@/components/product/product-card';
import { Heart, ArrowRight } from 'lucide-react';

export default function FavoritosPage() {
  const { wishlist } = useCart();
  const [catalog, setCatalog] = useState(FALLBACK_PRODUCTS);

  useEffect(() => {
    const stored = getStoredProductsSnapshot();
    const base = stored.length > 0 ? stored : FALLBACK_PRODUCTS;
    if (stored.length > 0) setCatalog(stored);

    const missingWishlisted = wishlist.some((id) => !base.some((p) => p.id === id));
    if (missingWishlisted || (wishlist.length > 0 && isSupabaseConfigured())) {
      let active = true;
      fetchProducts({ fresh: true }).then((remote) => {
        if (active && remote.length > 0) {
          setCatalog(remote);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [wishlist]);

  const wishlistedProducts = catalog.filter((p) =>
    wishlist.includes(p.id)
  );

  return (
    <div className="w-full bg-brand-background min-h-[70vh] py-12 sm:py-16 px-6 sm:px-10 lg:px-12">
      <div className="max-w-[1240px] mx-auto">
        <div className="border-b border-brand-border pb-6 mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block mb-1.5">
              Seleção Pessoal
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-brand-text tracking-tight">
              Lista de Desejos
            </h1>
            <p className="text-xs text-brand-textMuted mt-1.5 tabular-nums">
              {wishlistedProducts.length}{' '}
              {wishlistedProducts.length === 1 ? 'peça salva' : 'peças salvas'}
            </p>
          </div>
          <Link
            href="/produtos"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text hover:text-brand-gold flex items-center gap-2 transition-colors"
          >
            <span>Explorar acervo</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white border border-brand-border p-12 text-center max-w-md mx-auto my-12">
            <div className="w-10 h-10 bg-brand-background border border-brand-border flex items-center justify-center mx-auto mb-4 text-brand-gold">
              <Heart className="w-4 h-4 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-xl font-normal text-brand-text mb-1.5">
              Sua lista está vazia
            </h2>
            <p className="text-xs text-brand-textMuted mb-6 leading-relaxed">
              Salve suas joias favoritas para revisitá-las a qualquer momento.
            </p>
            <Link
              href="/produtos"
              className="inline-flex h-11 px-7 bg-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] items-center gap-2 hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors"
            >
              <span>Ver todas as joias</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-7">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
