'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchProductBySlug, getStoredProductsSnapshot } from '@/lib/api';
import { fetchAddressByCep, formatCepInput } from '@/lib/cep';
import { useCart } from '@/context/cart-context';
import { FinishType, Product } from '@/types';
import { SwatchSelector, FINISH_DETAILS } from '@/components/ui/swatch-selector';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { ProductCard } from '@/components/product/product-card';
import { Heart, Ruler, Plus, Minus, X } from 'lucide-react';

interface ProductDetailClientProps {
  initialProduct: Product | null;
  relatedProducts: Product[];
  slug: string;
}

export function ProductDetailClient({
  initialProduct,
  relatedProducts: initialRelated,
  slug,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelated);
  const { addToCart, isWishlisted, toggleWishlist } = useCart();

  const [selectedFinish, setSelectedFinish] = useState<FinishType>(
    initialProduct?.availableFinishes?.[0] || 'silver'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    initialProduct?.availableSizes?.[0] || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [cep, setCep] = useState<string>('');
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingResult, setShippingResult] = useState<string | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('specs');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Sincroniza itens importados localmente no admin caso a peça não estivesse no snapshot estático inicial
  useEffect(() => {
    const localList = getStoredProductsSnapshot();
    const localHit = localList.find((p) => p.slug === slug);
    if (localHit) {
      setProduct(localHit);
      setSelectedFinish(localHit.availableFinishes?.[0] || 'silver');
      setSelectedSize(localHit.availableSizes?.[0] || '');
      setRelatedProducts(localList.filter((p) => p.id !== localHit.id).slice(0, 4));
      return;
    }

    if (!initialProduct) {
      let active = true;
      fetchProductBySlug(slug).then((found) => {
        if (!active || !found) return;
        setProduct(found);
        setSelectedFinish(found.availableFinishes?.[0] || 'silver');
        setSelectedSize(found.availableSizes?.[0] || '');
      });
      return () => {
        active = false;
      };
    }
  }, [slug, initialProduct]);

  if (!product) {
    return (
      <div className="w-full bg-brand-background min-h-screen py-20 px-4 flex flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-brand-textMuted mb-4">
          Peça não encontrada no acervo.
        </p>
        <Link
          href="/produtos"
          className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text underline"
        >
          Voltar para o acervo
        </Link>
      </div>
    );
  }

  const isFavorite = isWishlisted(product.id);
  const currentPrice = product.promotionalPrice || product.price;
  const originalPrice = product.promotionalPrice ? product.price : null;
  const installmentValue = (currentPrice / 6).toFixed(2).replace('.', ',');

  const handleAddToCart = () => {
    addToCart(product, selectedFinish, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedFinish, selectedSize, quantity, false);
    router.push('/checkout');
  };

  const calculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setShippingResult('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setCalculatingShipping(true);
    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        setShippingResult('CEP não encontrado. Verifique os 8 dígitos e tente novamente.');
        return;
      }

      const locationPrefix = address.street
        ? `${address.street}, ${address.city}/${address.state}`
        : `${address.city}/${address.state}`;
      const shippingRateText =
        currentPrice * quantity >= 299
          ? 'Frete Cortesia • Entrega segurada em 2 a 4 dias úteis'
          : 'Sedex Segurado: R$ 24,90 • Entrega em 2 a 4 dias úteis';

      setShippingResult(`${locationPrefix} • ${shippingRateText}`);
    } finally {
      setCalculatingShipping(false);
    }
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  const heroImage = product.images[activeImageIndex] || product.images[0] || '/images/chain-grumet.webp';

  return (
    <div className="w-full bg-brand-background min-h-screen py-6 sm:py-14 px-4 sm:px-8 lg:px-12 pb-24 sm:pb-14">
      <div className="max-w-[1240px] mx-auto">
        {/* Breadcrumb Minimalista */}
        <nav
          className="text-[11px] uppercase tracking-[0.14em] text-brand-textMuted mb-5 sm:mb-8 flex items-center gap-2"
          aria-label="Navegação estrutural"
        >
          <Link href="/" prefetch={true} className="hover:text-brand-text transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link
            href="/produtos"
            prefetch={true}
            className="hover:text-brand-text transition-colors"
          >
            Acervo
          </Link>
          <span>/</span>
          <span className="text-brand-text line-clamp-1">{product.name}</span>
        </nav>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-14 items-start mb-14 sm:mb-20">
          {/* Galeria Editorial (Imagem principal primeiro no DOM para LCP imediato) */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="order-1 sm:order-2 relative aspect-[4/5] w-full bg-white border border-brand-border overflow-hidden">
              <Image
                src={heroImage}
                alt={product.name}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain p-4 sm:p-6"
              />
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Salvar nos favoritos"
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 w-9 h-9 bg-white/90 border border-brand-border flex items-center justify-center text-brand-text hover:border-brand-text transition-colors"
              >
                <Heart
                  className={`w-4 h-4 stroke-[1.5] ${
                    isFavorite ? 'fill-brand-text text-brand-text' : ''
                  }`}
                />
              </button>
            </div>

            {product.images.length > 1 && (
              <div className="order-2 sm:order-1 flex sm:flex-col gap-2.5 sm:gap-3 shrink-0 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-20 bg-white border overflow-hidden transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-brand-text'
                        : 'border-brand-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} vista ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Especificações e Compra */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6 bg-white p-5 sm:p-9 border border-brand-border">
            <div>
              <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-[0.2em]">
                {product.material || 'Aço Cirúrgico 316L & Prata 925'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-normal text-brand-text mt-1.5 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Preço */}
            <div className="py-4 border-y border-brand-border">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-brand-text tabular-nums">
                  R$ {currentPrice.toFixed(2).replace('.', ',')}
                </span>
                {originalPrice && (
                  <span className="text-sm text-brand-textMuted/70 line-through font-normal tabular-nums">
                    R$ {originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-textMuted mt-1 tabular-nums">
                em até 6x de R$ {installmentValue} sem juros
              </p>
            </div>

            {/* Seletor de Acabamento */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                  Acabamento:{' '}
                  <span className="text-brand-textMuted font-normal">
                    {FINISH_DETAILS[selectedFinish]?.short}
                  </span>
                </span>
              </div>
              <SwatchSelector
                availableFinishes={product.availableFinishes}
                selectedFinish={selectedFinish}
                onSelect={setSelectedFinish}
                size="md"
              />
            </div>

            {/* Seletor de Tamanho */}
            {product.availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                    Medida
                  </span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[11px] text-brand-textMuted hover:text-brand-text underline flex items-center gap-1.5"
                  >
                    <Ruler className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Guia de medidas</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`h-10 px-4 text-xs font-medium border transition-colors tabular-nums ${
                        selectedSize === sz
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                          : 'border-brand-border bg-white text-brand-text hover:border-brand-text'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantidade e CTAs */}
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                  Quantidade
                </span>
                <QuantitySelector
                  quantity={quantity}
                  onIncrease={() => setQuantity((q) => q + 1)}
                  onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="h-12 bg-white border border-brand-text hover:bg-brand-background text-brand-text text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
                >
                  Adicionar à sacola
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="h-12 bg-[#0A0A0A] text-white hover:bg-brand-gold hover:text-[#0A0A0A] text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
                >
                  Comprar agora
                </button>
              </div>
            </div>

            {/* Cálculo de Entrega */}
            <div className="p-4 bg-brand-background border border-brand-border">
              <label
                htmlFor="product-cep-input"
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text block mb-2.5"
              >
                Simular entrega
              </label>
              <form onSubmit={calculateShipping} className="flex gap-2">
                <input
                  id="product-cep-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                  value={cep}
                  onChange={(e) => setCep(formatCepInput(e.target.value))}
                  placeholder="00000-000"
                  className="flex-1 h-10 px-3 bg-white border border-brand-border text-xs text-brand-text focus:border-brand-text outline-none tabular-nums"
                />
                <button
                  type="submit"
                  disabled={calculatingShipping}
                  className="h-10 px-4 bg-white border border-brand-border hover:border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-50"
                >
                  {calculatingShipping ? 'Buscando...' : 'Calcular'}
                </button>
              </form>
              {shippingResult && (
                <p className="text-xs text-brand-text mt-2.5 font-medium">
                  {shippingResult}
                </p>
              )}
            </div>

            {/* Acordeões Minimalistas (+ / -) */}
            <div className="border-t border-brand-border pt-4 divide-y divide-brand-border">
              <div className="py-3.5 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text"
                >
                  <span>Especificações Técnicas</span>
                  {activeAccordion === 'specs' ? (
                    <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                </button>
                {activeAccordion === 'specs' && (
                  <p className="text-xs text-brand-textMuted mt-2.5 leading-relaxed">
                    {product.description ||
                      product.specifications ||
                      'Aço cirúrgico 316L e Prata 925 com polimento espelhado. Imune à água, maresia e suor. 100% hipoalergênico.'}
                  </p>
                )}
              </div>

              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text"
                >
                  <span>Conservação</span>
                  {activeAccordion === 'care' ? (
                    <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                </button>
                {activeAccordion === 'care' && (
                  <p className="text-xs text-brand-textMuted mt-2.5 leading-relaxed">
                    Lave com água corrente e sabão neutro após contato intenso com mar ou cloro. Seque com flanela macia.
                  </p>
                )}
              </div>

              <div className="py-3.5 last:pb-0">
                <button
                  type="button"
                  onClick={() => toggleAccordion('warranty')}
                  className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text"
                >
                  <span>Garantia Vitalícia EVORAH</span>
                  {activeAccordion === 'warranty' ? (
                    <Minus className="w-3.5 h-3.5 stroke-[1.5]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                </button>
                {activeAccordion === 'warranty' && (
                  <p className="text-xs text-brand-textMuted mt-2.5 leading-relaxed">
                    Garantia vitalícia contra oxidação, ferrugem e descascamento estrutural da liga metálica.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Peças Relacionadas */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-brand-border pt-10 sm:pt-14">
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-brand-text mb-6 sm:mb-8">
              Combinações Recomendadas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3.5 gap-y-7 sm:gap-x-7 sm:gap-y-10">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Barra Fixa Inferior Mobile-First (Ação Imediata no Polegar) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-brand-border px-4 py-2.5 flex items-center justify-between gap-2.5 shadow-luxury">
        <div className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.14em] text-brand-textMuted truncate">
            {FINISH_DETAILS[selectedFinish]?.short}
            {selectedSize ? ` • ${selectedSize}` : ''}
          </span>
          <span className="text-sm font-semibold text-brand-text tabular-nums">
            R$ {currentPrice.toFixed(2).replace('.', ',')}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="h-10 px-3.5 bg-white border border-brand-text text-brand-text text-[10px] font-semibold uppercase tracking-[0.14em]"
          >
            + Sacola
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="h-10 px-4 bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.14em]"
          >
            Comprar
          </button>
        </div>
      </div>

      {/* Modal Guia de Medidas */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border shadow-luxury max-w-md w-full p-7 relative">
            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="absolute top-5 right-5 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar guia de medidas"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text mb-1">
              Guia de Medidas EVORAH
            </h3>
            <p className="text-xs text-brand-textMuted mb-5">
              Referência de aros de anel e comprimentos de corrente.
            </p>

            <div className="border border-brand-border overflow-hidden mb-6">
              <table className="w-full text-xs text-left tabular-nums">
                <thead className="bg-brand-background text-brand-text font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 border-b border-brand-border">
                      Aro (Anel)
                    </th>
                    <th className="p-3 border-b border-brand-border">
                      Diâmetro
                    </th>
                    <th className="p-3 border-b border-brand-border">
                      Corrente
                    </th>
                  </tr>
                </thead>
                <tbody className="text-brand-textMuted divide-y divide-brand-border">
                  <tr>
                    <td className="p-3">16 a 18</td>
                    <td className="p-3">17,2 a 17,8 mm</td>
                    <td className="p-3">50 cm (Curta)</td>
                  </tr>
                  <tr>
                    <td className="p-3">20 a 22</td>
                    <td className="p-3">18,5 a 19,2 mm</td>
                    <td className="p-3">60 cm (Padrão)</td>
                  </tr>
                  <tr>
                    <td className="p-3">24 a 26</td>
                    <td className="p-3">19,8 a 20,6 mm</td>
                    <td className="p-3">70 cm (Longa)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="w-full h-11 bg-[#0A0A0A] text-white font-semibold text-[11px] uppercase tracking-[0.16em] hover:bg-brand-gold hover:text-[#0A0A0A] transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

