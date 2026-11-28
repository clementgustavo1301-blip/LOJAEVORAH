'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Product, CartItem, FinishType, KitSettings } from '@/types';
import { fetchProducts } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import {
  calculateOrderDiscounts,
  DEFAULT_KIT_SETTINGS,
  sanitizeKitSettings,
} from '@/lib/kit-pricing';

export interface KitSelectionEntry {
  product: Product;
  finish: FinishType;
  size?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    finish: FinishType,
    size?: string,
    quantity?: number,
    openMiniCart?: boolean
  ) => void;
  addKitToCart: (entries: KitSelectionEntry[], openMiniCart?: boolean) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  kitSubtotal: number;
  kitItemCount: number;
  hasKitItems: boolean;
  kitDiscountPercent: number;
  kitDiscount: number;
  couponDiscount: number;
  discount: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  total: number;
  installmentsText: string;
  coupon: string;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  kitSettings: KitSettings;
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
  const [kitSettings, setKitSettings] = useState<KitSettings>(DEFAULT_KIT_SETTINGS);
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
    fetch('/api/kit-settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.settings) {
          setKitSettings(sanitizeKitSettings(data.settings));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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

  const addKitToCart = useCallback(
    (entries: KitSelectionEntry[], openMiniCart = true) => {
      if (!Array.isArray(entries) || entries.length === 0) return;

      const kitId = `kit-${Date.now()}`;
      const kitLabel = `Kit EVORAH (${entries.length} peças)`;

      setItems((prev) => {
        const next = [...prev];
        for (const entry of entries) {
          const unitPrice = entry.product.promotionalPrice || entry.product.price;
          const itemId = `${kitId}-${entry.product.id}-${entry.finish}-${entry.size || 'default'}`;
          const existingIdx = next.findIndex((i) => i.id === itemId);
          if (existingIdx >= 0) {
            next[existingIdx] = {
              ...next[existingIdx],
              quantity: next[existingIdx].quantity + 1,
            };
          } else {
            next.push({
              id: itemId,
              productId: entry.product.id,
              product: entry.product,
              finish: entry.finish,
              size: entry.size,
              quantity: 1,
              price: unitPrice,
              kitId,
              kitLabel,
            });
          }
        }
        return next;
      });

      if (!kitSettings.allowCouponStacking) {
        setCoupon('');
        try {
          localStorage.removeItem('brand_name_coupon');
        } catch {}
      }

      if (openMiniCart) {
        setIsMiniCartOpen(true);
      }
    },
    [kitSettings.allowCouponStacking]
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

  const applyCoupon = useCallback(
    (code: string) => {
      const hasActiveKit = items.some((i) => Boolean(i.kitId));
      if (hasActiveKit && !kitSettings.allowCouponStacking) {
        return {
          success: false,
          message: `O desconto do Kit EVORAH (máximo ${kitSettings.maxDiscountPercent}% OFF) não acumula com cupons.`,
        };
      }

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
    },
    [items, kitSettings.allowCouponStacking, kitSettings.maxDiscountPercent]
  );

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
    const kitItems = items.filter((it) => Boolean(it.kitId));
    const kitSubtotal = kitItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const kitItemCount = kitItems.reduce((acc, it) => acc + it.quantity, 0);
    const hasKitItems = kitItemCount > 0;

    const pricing = calculateOrderDiscounts({
      subtotal,
      kitSubtotal,
      kitItemCount,
      couponCode: coupon,
      paymentMethod: 'CREDIT_CARD',
      kitSettings,
    });

    const discount = pricing.totalDiscount;
    const freeShippingThreshold = 0;
    const shippingFee = 0;
    const freeShippingRemaining = 0;
    const total = Math.max(0, pricing.total + shippingFee);
    const installmentValue = total > 0 ? (total / 6).toFixed(2).replace('.', ',') : '0,00';
    const installmentsText = `em até 6x de R$ ${installmentValue} sem juros`;
    const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);

    return {
      items,
      addToCart,
      addKitToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      kitSubtotal,
      kitItemCount,
      hasKitItems,
      kitDiscountPercent: pricing.kitDiscountPercent,
      kitDiscount: pricing.kitDiscount,
      couponDiscount: pricing.couponDiscount,
      discount,
      shippingFee,
      freeShippingThreshold,
      freeShippingRemaining,
      total,
      installmentsText,
      coupon,
      applyCoupon,
      removeCoupon,
      kitSettings,
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
    kitSettings,
    wishlist,
    isMiniCartOpen,
    addToCart,
    addKitToCart,
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
