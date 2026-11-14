'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SwatchSelector, FINISH_DETAILS } from '@/components/ui/swatch-selector';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Rating } from '@/components/ui/rating';
import { ProductCard } from '@/components/product/product-card';
import { FinishType, Product } from '@/types';
import {
  Shield,
  Gem,
  Award,
  Copy,
  Check,
  ArrowLeft,
  Palette,
  Type,
  Box,
  Cpu,
} from 'lucide-react';

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<FinishType>('silver');
  const [interactiveQuantity, setInteractiveQuantity] = useState(2);
  const [testRating, setTestRating] = useState(4.9);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'typography' | 'components' | 'spec'>('tokens');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sampleProduct: Product = {
    id: 'ds-sample-1',
    name: 'Corrente Veneziana Maciça 3mm',
    slug: 'corrente-veneziana-macica-3mm',
    description: 'Corrente clássica em elos entrelaçados compactos em aço inoxidável 316L cirúrgico. Acabamento espelhado de alta reflexão.',
    price: 189.9,
    promotionalPrice: 149.9,
    material: 'Aço Inoxidável 316L Cirúrgico',
    availableFinishes: ['silver', 'gold', 'black', 'bicolor'],
    availableSizes: ['50cm', '60cm', '70cm'],
    images: [
      '/images/chain-grumet.webp',
      '/images/chain-rope.webp',
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: true,
    rating: 4.9,
    reviewsCount: 128,
    categoryId: 'cat-correntes',
  };

  const colorPalettes = [
    {
      group: 'Cores Principais & Superfícies',
      colors: [
        { name: 'brand-background', hex: '#F9F9F7', desc: 'Fundo principal editorial da aplicação' },
        { name: 'brand-surface', hex: '#FFFFFF', desc: 'Superfícies de cards, modais e containers' },
        { name: 'brand-elevated', hex: '#F3F3F1', desc: 'Superfícies secundárias e áreas de destaque' },
        { name: 'brand-text', hex: '#171717', desc: 'Tipografia primária e chamadas principais' },
      ],
    },
    {
      group: 'Estrutura em Escala de Cinza',
      colors: [
        { name: 'brand-border', hex: '#E5E5DF', desc: 'Bordas de separação e contornos sutis' },
        { name: 'brand-textMuted', hex: '#6B6B66', desc: 'Textos de apoio secundários e legendas' },
        { name: 'brand-accent', hex: '#262626', desc: 'Acento monocromático secundário' },
        { name: 'gray-graphite', hex: '#222222', desc: 'Contraste escuro de apoio' },
      ],
    },
    {
      group: 'Acabamentos Nobres em Inox & PVD',
      colors: [
        { name: 'brand-gold', hex: '#C9A227', desc: 'Ouro 18k PVD & destaques nobres' },
        { name: 'brand-goldMuted', hex: '#E5C866', desc: 'Brilho reflexivo dourado' },
        { name: 'brand-silverBright', hex: '#E2E5E8', desc: 'Bisel e highlight de iluminação' },
      ],
    },
    {
      group: 'Semântica e Feedback',
      colors: [
        { name: 'status-success', hex: '#3BB273', desc: 'Confirmação, estoque garantido e frete grátis' },
        { name: 'status-error', hex: '#E05252', desc: 'Erros de validação e cancelamentos' },
        { name: 'status-warning', hex: '#DDA032', desc: 'Avisos de poucas unidades no estoque' },
        { name: 'status-info', hex: '#5B8FF9', desc: 'Rastreamento e detalhes de logística' },
      ],
    },
  ];

  return (
    <div className="w-full bg-brand-background text-brand-textMuted min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-border pb-4 gap-3">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-brand-textMuted hover:text-brand-text transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Voltar à Loja</span>
            </Link>
            <div className="flex items-center gap-2.5 pt-0.5">
              <Logo variant="horizontal" color="black" />
              <span className="text-[9.5px] font-mono tracking-wider text-brand-gold border border-brand-gold/30 px-1.5 py-0.5 rounded-xs uppercase">
                Design System v2.0
              </span>
            </div>
            <p className="text-[11.5px] text-brand-textMuted font-light max-w-xl">
              Especificação compacta de tokens, tipografia de alta densidade, componentes interativos e engenharia metalúrgica 316L.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white border border-brand-border p-1 rounded-md">
            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors ${
                activeTab === 'tokens' ? 'bg-brand-text text-white' : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              Cores & Tokens
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors ${
                activeTab === 'typography' ? 'bg-brand-text text-white' : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              Tipografia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors ${
                activeTab === 'components' ? 'bg-brand-text text-white' : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              Componentes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('spec')}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase rounded-xs transition-colors ${
                activeTab === 'spec' ? 'bg-brand-text text-white' : 'text-brand-textMuted hover:text-brand-text'
              }`}
            >
              Engenharia 316L
            </button>
          </div>
        </div>

        {/* TAB 1: TOKENS DE CORES */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="border-b border-brand-border pb-3">
              <h2 className="text-base font-medium text-brand-text tracking-tight flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-gold" />
                <span>Tokens de Cores & Superfícies</span>
              </h2>
              <p className="text-[11px] text-brand-textMuted mt-0.5">
                Clique em qualquer cartão para copiar o código HEX.
              </p>
            </div>

            <div className="space-y-5">
              {colorPalettes.map((section, idx) => (
                <div key={idx} className="space-y-2.5">
                  <h3 className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-brand-text">
                    {section.group}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {section.colors.map((c) => {
                      const isCopied = copiedToken === c.name;
                      return (
                        <div
                          key={c.name}
                          onClick={() => copyToClipboard(c.hex, c.name)}
                          className="group cursor-pointer bg-white border border-brand-border hover:border-brand-text/40 transition-all p-2.5 rounded-lg relative"
                        >
                          <div
                            className="w-full h-14 rounded-md mb-2 border border-black/10 relative flex items-center justify-center"
                            style={{ backgroundColor: c.hex }}
                          >
                            <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-xs bg-black/75 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {isCopied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5" />}
                              {isCopied ? 'Copiado!' : 'Copiar'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-brand-text">
                              {c.name}
                            </span>
                            <span className="text-[10px] font-mono text-brand-textMuted uppercase">
                              {c.hex}
                            </span>
                          </div>
                          <p className="text-[10px] text-brand-textMuted font-light mt-1 leading-snug">
                            {c.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Micro Finishes Visual Preview */}
            <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                Os 4 Acabamentos Físicos da Marca
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(FINISH_DETAILS).map(([key, info]) => (
                  <div key={key} className="bg-brand-background border border-brand-border p-3 rounded-md flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full border border-black/20 shrink-0 ${info.background}`} />
                    <div>
                      <div className="text-[11px] font-medium text-brand-text">{info.label}</div>
                      <div className="text-[9.5px] text-brand-textMuted mt-0.5">{info.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TIPOGRAFIA */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="border-b border-brand-border pb-3">
              <h2 className="text-base font-medium text-brand-text tracking-tight flex items-center gap-2">
                <Type className="w-4 h-4 text-brand-gold" />
                <span>Escala Tipográfica Compacta</span>
              </h2>
              <p className="text-[11px] text-brand-textMuted mt-0.5">
                Família primária: <strong>Manrope</strong> (Sans) com suporte a <code>tabular-nums</code> para preços e métricas.
              </p>
            </div>

            <div className="space-y-4 bg-white border border-brand-border p-5 rounded-lg">
              <div className="border-b border-brand-border pb-4">
                <span className="text-[9.5px] font-mono text-brand-textMuted uppercase block mb-1">
                  display-hero • 30px-34px / Regular / -0.025em
                </span>
                <div className="text-2xl sm:text-3xl font-normal text-brand-text tracking-tight leading-tight">
                  Aço Inoxidável Cirúrgico 316L
                </div>
              </div>

              <div className="border-b border-brand-border pb-4">
                <span className="text-[9.5px] font-mono text-brand-textMuted uppercase block mb-1">
                  h1 • 20px-24px / Regular / -0.02em
                </span>
                <div className="text-xl sm:text-2xl font-normal text-brand-text tracking-tight leading-snug">
                  Coleção Atelier: Joias para Todos os Momentos
                </div>
              </div>

              <div className="border-b border-brand-border pb-4">
                <span className="text-[9.5px] font-mono text-brand-textMuted uppercase block mb-1">
                  h2 • 18px / Medium / -0.015em
                </span>
                <div className="text-lg font-medium text-brand-text tracking-tight leading-snug">
                  Corrente Veneziana & Pingente Bússola Náutica
                </div>
              </div>

              <div className="border-b border-brand-border pb-4">
                <span className="text-[9.5px] font-mono text-brand-textMuted uppercase block mb-1">
                  body • 12.5px / Regular / 1.5
                </span>
                <p className="text-[12.5px] text-brand-textMuted font-normal leading-relaxed max-w-2xl">
                  O Aço 316L é uma liga austenítica com adição de molibdênio, tornando-o imune a corrosões por cloretos. É o mesmo material exigido internacionalmente para próteses médicas e instrumentos cirúrgicos de precisão.
                </p>
              </div>

              <div>
                <span className="text-[9.5px] font-mono text-brand-textMuted uppercase block mb-1">
                  caption / button • 10px - 11px / Semibold / 0.1em / Uppercase
                </span>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-gold">
                    FRETE GRÁTIS ACIMA DE R$ 299
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-text">
                    POLIMENTO ESPELHADO ARTESANAL
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-brand-textMuted">
                    REF: INX-316L-COR-001
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPONENTES */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="border-b border-brand-border pb-3">
              <h2 className="text-base font-medium text-brand-text tracking-tight flex items-center gap-2">
                <Box className="w-4 h-4 text-brand-gold" />
                <span>Biblioteca de Componentes Compactos</span>
              </h2>
              <p className="text-[11px] text-brand-textMuted mt-0.5">
                Componentes reutilizáveis construídos sobre Tailwind e os tokens de design.
              </p>
            </div>

            {/* 1. Botões */}
            <div className="bg-white border border-brand-border p-4 rounded-lg space-y-4">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                1. Botões (Variantes & Estados)
              </h3>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="gold">Gold Accent</Button>
                <Button variant="ghost">Ghost</Button>
                <Button
                  variant="primary"
                  isLoading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 2000);
                  }}
                >
                  {buttonLoading ? 'Carregando' : 'Testar Loading'}
                </Button>
                <Button variant="primary" disabled>
                  Desabilitado
                </Button>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-brand-border">
                <span className="text-[10px] text-brand-textMuted uppercase">Tamanhos:</span>
                <Button size="sm" variant="outline">Pequeno (sm)</Button>
                <Button size="md" variant="outline">Médio (md)</Button>
                <Button size="lg" variant="outline">Grande (lg)</Button>
              </div>
            </div>

            {/* 2. Badges */}
            <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                2. Badges de Identificação & Acabamentos
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="silver">Aço Polido</Badge>
                <Badge variant="gold">Ouro 18k PVD</Badge>
                <Badge variant="black">Black PVD</Badge>
                <Badge variant="bicolor">Bicolor</Badge>
                <Badge variant="sale">21% OFF</Badge>
                <Badge variant="new">Lançamento</Badge>
                <Badge variant="success">Em Estoque</Badge>
              </div>
            </div>

            {/* 3. Seletor de Acabamentos e Quantidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
                <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                  3. Seletor de Acabamento Dinâmico (Swatch)
                </h3>
                <SwatchSelector
                  availableFinishes={['silver', 'gold', 'black', 'bicolor']}
                  selectedFinish={selectedFinish}
                  onSelect={(f) => setSelectedFinish(f)}
                  showLabels
                  size="md"
                />
                <div className="text-[10.5px] text-brand-textMuted bg-brand-background p-2.5 rounded-md border border-brand-border">
                  Selecionado: <strong>{FINISH_DETAILS[selectedFinish].label}</strong>
                </div>
              </div>

              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
                <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                  4. Quantidade & Avaliação (Rating)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-brand-textMuted uppercase">Quantidade:</span>
                    <QuantitySelector
                      quantity={interactiveQuantity}
                      onIncrease={() => setInteractiveQuantity((q) => q + 1)}
                      onDecrease={() => setInteractiveQuantity((q) => Math.max(1, q - 1))}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-brand-textMuted uppercase">Rating:</span>
                    <Rating rating={testRating} reviewsCount={128} size="sm" />
                    <div className="flex gap-1">
                      {[4, 4.5, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTestRating(val)}
                          className="px-1.5 py-0.5 text-[9.5px] rounded-xs bg-brand-background border border-brand-border hover:border-brand-text text-brand-text"
                        >
                          {val}★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Inputs e Formulários */}
            <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                5. Campos de Entrada (Inputs)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Nome Completo" placeholder="Ex: Alexandre Silva" />
                <Input label="E-mail" placeholder="seu@email.com" defaultValue="contato@inoxatelier.com" />
                <Input
                  label="CEP (com validação)"
                  placeholder="00000-000"
                  error="Formato de CEP inválido"
                />
              </div>
            </div>

            {/* 5. Live Product Card Preview */}
            <div className="bg-white border border-brand-border p-4 rounded-lg space-y-3">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text">
                6. Cartão de Produto Compacto (Product Card)
              </h3>
              <div className="max-w-[220px]">
                <ProductCard product={sampleProduct} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ENGENHARIA 316L */}
        {activeTab === 'spec' && (
          <div className="space-y-6">
            <div className="border-b border-brand-border pb-3">
              <h2 className="text-base font-medium text-brand-text tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-gold" />
                <span>Especificação Metalúrgica • Aço Cirúrgico 316L</span>
              </h2>
              <p className="text-[11px] text-brand-textMuted mt-0.5">
                Atributos de engenharia que diferenciam a liga 316L de joias convencionais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-brand-background border border-brand-border flex items-center justify-center text-brand-text">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[11.5px] font-semibold text-brand-text uppercase tracking-wider">
                  Resistência Perpétua
                </h3>
                <p className="text-[11px] text-brand-textMuted font-light leading-snug">
                  Não oxida em contato com água do mar, cloro de piscina ou suor intenso.
                </p>
              </div>

              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-brand-background border border-brand-border flex items-center justify-center text-brand-text">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[11.5px] font-semibold text-brand-text uppercase tracking-wider">
                  Hipoalergênico Grau Médico
                </h3>
                <p className="text-[11px] text-brand-textMuted font-light leading-snug">
                  Livre de liberação de níquel reativo. Seguro para peles sensíveis.
                </p>
              </div>

              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center text-brand-gold">
                  <Gem className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[11.5px] font-semibold text-brand-text uppercase tracking-wider">
                  Revestimento PVD Real
                </h3>
                <p className="text-[11px] text-brand-textMuted font-light leading-snug">
                  Physical Vapor Deposition em vácuo térmico molecular 10x superior.
                </p>
              </div>

              <div className="bg-white border border-brand-border p-4 rounded-lg space-y-2">
                <div className="w-7 h-7 rounded-md bg-brand-background border border-brand-border flex items-center justify-center text-brand-text">
                  <Gem className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[11.5px] font-semibold text-brand-text uppercase tracking-wider">
                  Garantia Vitalícia
                </h3>
                <p className="text-[11px] text-brand-textMuted font-light leading-snug">
                  Certificado de autenticidade estrutural acompanha cada pedido.
                </p>
              </div>
            </div>

            {/* Metal Composition Table */}
            <div className="bg-white border border-brand-border p-4 rounded-lg">
              <h3 className="text-[10.5px] font-semibold tracking-wider uppercase text-brand-text mb-3">
                Composição Química da Liga Austenítica AISI 316L
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-textMuted uppercase text-[9.5px] tracking-wider">
                      <th className="py-2 px-2.5">Elemento</th>
                      <th className="py-2 px-2.5">Símbolo</th>
                      <th className="py-2 px-2.5">Concentração</th>
                      <th className="py-2 px-2.5">Função Metalúrgica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-brand-textMuted font-light">
                    <tr>
                      <td className="py-2 px-2.5 font-medium text-brand-text">Ferro</td>
                      <td className="py-2 px-2.5 font-mono">Fe</td>
                      <td className="py-2 px-2.5 tabular-nums">Bal. (~65%)</td>
                      <td className="py-2 px-2.5">Matriz base estrutural de alta dureza mecânica.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-medium text-brand-text">Cromo</td>
                      <td className="py-2 px-2.5 font-mono">Cr</td>
                      <td className="py-2 px-2.5 tabular-nums">16.0 - 18.0%</td>
                      <td className="py-2 px-2.5">Película passiva invisível de óxido protetor autorregenerável.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-medium text-brand-text">Níquel</td>
                      <td className="py-2 px-2.5 font-mono">Ni</td>
                      <td className="py-2 px-2.5 tabular-nums">10.0 - 14.0%</td>
                      <td className="py-2 px-2.5">Estabilização da fase austenítica não-magnética e brilho intenso.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-medium text-brand-text">Molibdênio</td>
                      <td className="py-2 px-2.5 font-mono">Mo</td>
                      <td className="py-2 px-2.5 tabular-nums">2.0 - 3.0%</td>
                      <td className="py-2 px-2.5">Proteção avançada contra corrosão por frestas e ataque de cloretos.</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-medium text-brand-text">Carbono Extra Baixo</td>
                      <td className="py-2 px-2.5 font-mono">C (L)</td>
                      <td className="py-2 px-2.5 tabular-nums">&le; 0.03%</td>
                      <td className="py-2 px-2.5">Preserva a soldagem e a biocompatibilidade hipoalergênica.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
