'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Product, CartItem, FinishType } from '@/types';
import { fetchProducts } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    finish: FinishType,
    size?: string,
    quantity?: number,
    openMiniCart?: boolean
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  total: number;
  installmentsText: string;
  coupon: string;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  isMiniCartOpen: boolean;
  setIsMiniCartOpen: (open: boolean) => void;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string>('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const syncedWishlistUserRef = useRef<string | null>(null);
  const wishlistRef = useRef<string[]>([]);

  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  useEffect(() => {
    let active = true;
    let hasCartItems = false;

    try {
      const savedCart = localStorage.getItem('brand_name_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          hasCartItems = true;
        }
      }

      const savedWishlist = localStorage.getItem('brand_name_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedCoupon = localStorage.getItem('brand_name_coupon');
      if (savedCoupon) setCoupon(savedCoupon);
    } catch {
      // Ignorar fallback
    }
    setMounted(true);

    if (hasCartItems && isSupabaseConfigured()) {
      fetchProducts({ fresh: true }).then((catalog) => {
        if (!active || catalog.length === 0) return;
        const byId = new Map(catalog.map((p) => [p.id, p]));
        setItems((prev) =>
          prev.map((item) => {
            const latest = byId.get(item.productId);
            if (!latest) return item;
            const livePrice = latest.promotionalPrice || latest.price;
            return { ...item, product: latest, price: livePrice };
          })
        );
      });
    }

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('brand_name_cart', JSON.stringify(items));
    } catch {}
  }, [items, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('brand_name_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, mounted]);

  // Mescla e sincroniza favoritos locais com a nuvem ao fazer login
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !user?.id) {
      syncedWishlistUserRef.current = null;
      return;
    }
    if (syncedWishlistUserRef.current === user.id) return;
    syncedWishlistUserRef.current = user.id;

    let active = true;
    fetch('/api/account/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: wishlistRef.current }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !Array.isArray(data?.productIds)) return;
        setWishlist(data.productIds);
      })
      .catch(() => {
        // Mantém favoritos locais em caso de indisponibilidade temporária
      });

    return () => {
      active = false;
    };
  }, [mounted, isAuthenticated, user?.id]);

  const addToCart = useCallback(
    (
      product: Product,
      finish: FinishType,
      size?: string,
      quantity = 1,
      openMiniCart = true
    ) => {
      const unitPrice = product.promotionalPrice || product.price;
      const itemId = `${product.id}-${finish}-${size || 'default'}`;

      setItems((prev) => {
        const existing = prev.find((i) => i.id === itemId);
        if (existing) {
          return prev.map((i) =>
            i.id === itemId
              ? { ...i, product, price: unitPrice, quantity: i.quantity + quantity }
              : i
          );
        }
        return [
          ...prev,
          {
            id: itemId,
            productId: product.id,
            product,
            finish,
            size,
            quantity,
            price: unitPrice,
          },
        ];
      });

      if (openMiniCart) {
        setIsMiniCartOpen(true);
      }
    },
    []
  );

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BEMVINDO10') {
      setCoupon('BEMVINDO10');
      try {
        localStorage.setItem('brand_name_coupon', 'BEMVINDO10');
      } catch {}
      return { success: true, message: 'Cupom de 10% aplicado com sucesso!' };
    }
    if (clean === 'INOX15') {
      setCoupon('INOX15');
      try {
        localStorage.setItem('brand_name_coupon', 'INOX15');
      } catch {}
      return { success: true, message: 'Cupom exclusivo de 15% aplicado!' };
    }
    return { success: false, message: 'Cupom inválido ou expirado.' };
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon('');
    try {
      localStorage.removeItem('brand_name_coupon');
    } catch {}
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );

      if (isAuthenticated && user?.id) {
        fetch('/api/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (Array.isArray(data?.productIds)) {
              setWishlist(data.productIds);
            }
          })
          .catch(() => {
            // Mantém atualização otimista local
          });
      }
    },
    [isAuthenticated, user?.id]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  const contextValue = useMemo<CartContextType>(() => {
    const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    let discount = 0;
    const upperCoupon = coupon.toUpperCase();
    if (upperCoupon === 'BEMVINDO10') {
      discount = subtotal * 0.1;
    } else if (upperCoupon === 'INOX15') {
      discount = subtotal * 0.15;
    }

    const freeShippingThreshold = 0;
    const shippingFee = 0;
    const freeShippingRemaining = 0;
    const total = Math.max(0, subtotal - discount + shippingFee);
    const installmentValue = total > 0 ? (total / 6).toFixed(2).replace('.', ',') : '0,00';
    const installmentsText = `em até 6x de R$ ${installmentValue} sem juros`;
    const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      discount,
      shippingFee,
      freeShippingThreshold,
      freeShippingRemaining,
      total,
      installmentsText,
      coupon,
      applyCoupon,
      removeCoupon,
      wishlist,
      toggleWishlist,
      isWishlisted,
      isMiniCartOpen,
      setIsMiniCartOpen,
      totalCount,
    };
  }, [
    items,
    coupon,
    wishlist,
    isMiniCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    toggleWishlist,
    isWishlisted,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
