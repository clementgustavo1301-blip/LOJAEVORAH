'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Product, CartItem, FinishType } from '@/types';

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
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string>('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('brand_name_cart');
      if (savedCart) setItems(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem('brand_name_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedCoupon = localStorage.getItem('brand_name_coupon');
      if (savedCoupon) setCoupon(savedCoupon);
    } catch {
      // Ignorar fallback
    }
    setMounted(true);
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
            i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i
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

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

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
