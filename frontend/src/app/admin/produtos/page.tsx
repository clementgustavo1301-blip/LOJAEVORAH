'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchProducts,
  fetchCategories,
  getStoredProductsSnapshot,
  updateProductSupplier,
  createProductFromImport,
  deleteProduct,
  detectSupplierPlatform,
  FALLBACK_CATEGORIES,
} from '@/lib/api';
import { Category, Product, FinishType, SupplierPlatform } from '@/types';
import {
  Package,
  Store,
  Edit3,
  Search,
  Check,
  X,
  RefreshCw,
  Plus,
  Link2,
  Image as ImageIcon,
  Trash2,
  Upload,
} from 'lucide-react';

function parseCurrencyInput(raw: string, fallback: number): number {
  const cleaned = raw.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return fallback;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : fallback;
}

function ProductPlacementFields({
  categories,
  categoryId,
  onCategoryChange,
  isBestSeller,
  onToggleBestSeller,
  isNew,
  onToggleNew,
  isFeatured,
  onToggleFeatured,
}: {
  categories: Category[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  isBestSeller: boolean;
  onToggleBestSeller: () => void;
  isNew: boolean;
  onToggleNew: () => void;
  isFeatured: boolean;
  onToggleFeatured: () => void;
}) {
  const sectionOptions = [
    {
      id: 'bestSeller',
      label: 'Mais Vendidos',
      hint: 'Seção Peças Mais Desejadas',
      checked: isBestSeller,
      onToggle: onToggleBestSeller,
    },
    {
      id: 'isNew',
      label: 'Lançamentos',
      hint: 'Seção Lançamentos Recentes',
      checked: isNew,
      onToggle: onToggleNew,
    },
    {
      id: 'isFeatured',
      label: 'Destaque',
      hint: 'Curadoria do catálogo',
      checked: isFeatured,
      onToggle: onToggleFeatured,
    },
  ];

  return (
    <div className="space-y-3 rounded-sm border border-brand-border bg-brand-background/50 p-3">
      <div>
        <label className="text-xs font-medium text-brand-text block mb-1.5">
          Categoria dentro do site
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`px-2.5 h-8 rounded-sm border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  active
                    ? 'bg-brand-text text-white border-brand-text'
                    : 'bg-white text-brand-textMuted border-brand-border hover:border-brand-text hover:text-brand-text'
                }`}
              >
                {active && <Check className="w-3 h-3" />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-brand-border">
        <label className="text-xs font-medium text-brand-text block mb-1.5">
          Vitrines / Seções da loja
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sectionOptions.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={sec.onToggle}
              aria-pressed={sec.checked}
              className={`p-2 rounded-sm border text-left transition-colors flex items-start gap-2 ${
                sec.checked
                  ? 'bg-white border-brand-text text-brand-text'
                  : 'bg-transparent border-brand-border text-brand-textMuted hover:border-brand-text/60'
              }`}
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${
                  sec.checked
                    ? 'bg-brand-text border-brand-text text-white'
                    : 'bg-white border-brand-border'
                }`}
              >
                {sec.checked && <Check className="w-3 h-3" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold leading-tight">
                  {sec.label}
                </span>
                <span className="block text-[10px] text-brand-textMuted leading-tight mt-0.5">
                  {sec.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminProdutosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | SupplierPlatform>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Importação por link
  const [quickLinkUrl, setQuickLinkUrl] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [extractingLink, setExtractingLink] = useState(false);
  const [extractionFeedback, setExtractionFeedback] = useState<string | null>(null);
  const [pastedAdText, setPastedAdText] = useState('');
  const [showPasteHelper, setShowPasteHelper] = useState(false);

  // Modal de Importação (Novo Produto)
  const [importUrl, setImportUrl] = useState('');
  const [importPlatform, setImportPlatform] = useState<SupplierPlatform>('SHOPEE');
  const [importSupplierName, setImportSupplierName] = useState('Shopee Brasil');
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importCategory, setImportCategory] = useState('cat-correntes');
  const [importIsBestSeller, setImportIsBestSeller] = useState(true);
  const [importIsNew, setImportIsNew] = useState(true);
  const [importIsFeatured, setImportIsFeatured] = useState(true);
  const [importCost, setImportCost] = useState('');
  const [importSalePrice, setImportSalePrice] = useState('');
  const [importDeliveryDays, setImportDeliveryDays] = useState('4 a 8 dias úteis');
  const [importImages, setImportImages] = useState<string[]>([]);
  const [importFinishes, setImportFinishes] = useState<FinishType[]>(['silver', 'gold', 'black']);
  const [importSizes, setImportSizes] = useState('');
  const [importingSaving, setImportingSaving] = useState(false);

  // Edição de produto existente
  const [editProductName, setEditProductName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('cat-correntes');
  const [editIsBestSeller, setEditIsBestSeller] = useState(true);
  const [editIsNew, setEditIsNew] = useState(true);
  const [editIsFeatured, setEditIsFeatured] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [supplierCost, setSupplierCost] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [editImagesText, setEditImagesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const instant = getStoredProductsSnapshot();
    if (instant.length > 0) {
      setProducts(instant);
      setLoading(false);
    }
    loadProducts(instant.length === 0);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProducts = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        fetchProducts({ fresh: true }),
        fetchCategories().catch(() => FALLBACK_CATEGORIES),
      ]);
      setProducts(data);
      if (cats.length > 0) setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (files: FileList | null, target: 'import' | 'edit') => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (!result) return;
        if (target === 'import') {
          setImportImages((prev) => {
            const clean = prev.filter(
              (u) => u.trim() && u !== '/images/chain-grumet.webp' && !u.includes('images.unsplash.com/photo-1599643478518-a784e5dc4c8f')
            );
            return [...clean, result];
          });
        } else {
          setEditImagesText((prev) => (prev.trim() ? `${prev.trim()}\n${result}` : result));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExtractFromUrl = async (targetUrl: string, rawText?: string) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl && !rawText?.trim()) return;

    if (cleanUrl) setImportUrl(cleanUrl);
    setIsImportModalOpen(true);
    setExtractingLink(true);
    setExtractionFeedback(null);

    const detected = detectSupplierPlatform(cleanUrl);
    setImportPlatform(detected);
    if (detected === 'SHOPEE') {
      setImportSupplierName('Shopee Brasil');
      setImportDeliveryDays('4 a 8 dias úteis');
    } else if (detected === 'TIKTOK') {
      setImportSupplierName('TikTok Shop');
      setImportDeliveryDays('3 a 6 dias úteis');
    }

    try {
      const res = await fetch('/api/suppliers/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, pastedText: rawText || pastedAdText }),
      });

      if (res.ok) {
        const json = await res.json();
        const ext = json.data;
        if (ext) {
          setImportPlatform(ext.platform);
          setImportSupplierName(ext.supplierName);
          if (ext.resolvedUrl) setImportUrl(ext.resolvedUrl);
          if (ext.suggestedName) setImportName(ext.suggestedName);
          if (ext.suggestedDescription) setImportDescription(ext.suggestedDescription);
          setImportCategory(ext.suggestedCategory || 'cat-correntes');
          setImportDeliveryDays(ext.estimatedDeliveryDays);
          if (Array.isArray(ext.suggestedSizes) && ext.suggestedSizes.length > 0) {
            setImportSizes(ext.suggestedSizes.join(', '));
          }
          if (Array.isArray(ext.suggestedFinishes) && ext.suggestedFinishes.length > 0) {
            setImportFinishes(ext.suggestedFinishes);
          }
          if (ext.suggestedCost) setImportCost(Number(ext.suggestedCost).toFixed(2));
          if (ext.suggestedPrice) setImportSalePrice(Number(ext.suggestedPrice).toFixed(2));
          if (ext.suggestedImages?.length > 0) {
            setImportImages(ext.suggestedImages);
          }

          if (ext.priceDetected) {
            setExtractionFeedback(
              'Foto, descrição, tamanhos e valores carregados do anúncio. Revise antes de salvar.'
            );
          } else {
            setExtractionFeedback(
              'Foto, nome e descrição carregados. A Shopee não exibe o preço pelo link — informe o Custo real abaixo ou cole o texto do anúncio.'
            );
          }
        }
      }
    } catch {
      setExtractionFeedback('Preencha os campos abaixo para concluir o cadastro.');
    } finally {
      setExtractingLink(false);
      setQuickLinkUrl('');
    }
  };

  const handleParseCopiedText = (text: string) => {
    setPastedAdText(text);
    if (!text.trim()) return;

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    if (lines.length > 0 && !importName.trim()) {
      const titleLine = lines.find((l) => !/^R\$\s*\d/.test(l) && l.length > 5);
      if (titleLine) {
        setImportName(titleLine.slice(0, 110));
      }
    }

    if (lines.length > 1 && !importDescription.trim()) {
      const descText = lines
        .filter((l) => !/^R\$\s*\d/.test(l))
        .slice(1)
        .join('\n')
        .trim();
      if (descText.length >= 15) {
        setImportDescription(descText);
      }
    }

    const priceMatch = text.match(/(?:R\$\s*)?(\d{1,4}(?:[.,]\d{2}))/i);
    if (priceMatch?.[1]) {
      const normalized = priceMatch[1].includes(',')
        ? priceMatch[1].replace(/\./g, '').replace(',', '.')
        : priceMatch[1];
      const parsedCost = parseFloat(normalized);
      if (!isNaN(parsedCost) && parsedCost > 0) {
        setImportCost(parsedCost.toFixed(2));
        const recommendedSale = Math.max(99.9, Math.ceil((parsedCost * 3.2) / 10) * 10 - 0.1);
        setImportSalePrice(recommendedSale.toFixed(2));
      }
    }
  };

  const handleSelectPlatformPreset = (plat: SupplierPlatform) => {
    setImportPlatform(plat);
    if (plat === 'SHOPEE') {
      setImportSupplierName('Shopee Brasil');
      setImportDeliveryDays('4 a 8 dias úteis');
    } else if (plat === 'TIKTOK') {
      setImportSupplierName('TikTok Shop');
      setImportDeliveryDays('3 a 6 dias úteis');
    } else {
      setImportSupplierName('Fornecedor Parceiro');
      setImportDeliveryDays('5 a 10 dias úteis');
    }
  };

  const toggleImportFinish = (fin: FinishType) => {
    setImportFinishes((prev) =>
      prev.includes(fin) ? (prev.length > 1 ? prev.filter((f) => f !== fin) : prev) : [...prev, fin]
    );
  };

  const handleCreateImportedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim() || !importUrl.trim()) return;

    setImportingSaving(true);
    try {
      const costNum = parseCurrencyInput(importCost, 29.9);
      const priceNum = parseCurrencyInput(importSalePrice, 129.9);
      const cleanImgs = importImages.filter((u) => u.trim().length > 0);
      const parsedSizes = importSizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createProductFromImport({
        name: importName.trim(),
        description: importDescription.trim() || `${importName.trim()} em Aço Cirúrgico 316L.`,
        price: priceNum,
        supplierCost: costNum,
        images: cleanImgs.length > 0 ? cleanImgs : ['/images/chain-grumet.webp'],
        categoryId: importCategory,
        isNew: importIsNew,
        isBestSeller: importIsBestSeller,
        isFeatured: importIsFeatured,
        supplierName: importSupplierName.trim() || 'Shopee Brasil',
        supplierUrl: importUrl.trim(),
        estimatedDeliveryDays: importDeliveryDays.trim() || '4 a 8 dias úteis',
        availableFinishes: importFinishes,
        availableSizes: parsedSizes.length > 0 ? parsedSizes : ['50cm', '60cm'],
      });

      setProducts((prev) => [created, ...prev]);
      setIsImportModalOpen(false);
      router.refresh();
      showToast(`Produto "${created.name}" cadastrado.`);

      // Reset
      setImportName('');
      setImportDescription('');
      setImportUrl('');
      setImportCost('');
      setImportSalePrice('');
      setImportSizes('');
      setImportImages([]);
      setImportCategory('cat-correntes');
      setImportIsBestSeller(true);
      setImportIsNew(true);
      setImportIsFeatured(true);
      setExtractionFeedback(null);
      setPastedAdText('');
      setShowPasteHelper(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cadastrar produto. Tente novamente.');
    } finally {
      setImportingSaving(false);
    }
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setEditProductName(p.name);
    setEditDescription(p.description || '');
    setEditCategoryId(p.categoryId || categories[0]?.id || 'cat-correntes');
    setEditIsBestSeller(Boolean(p.isBestSeller));
    setEditIsNew(Boolean(p.isNew));
    setEditIsFeatured(Boolean(p.isFeatured));
    setSupplierName(p.supplierName || 'Shopee Brasil');
    setSupplierUrl(p.supplierUrl || '');
    setSupplierCost(p.supplierCost ? p.supplierCost.toFixed(2) : '25.00');
    setSalePrice((p.promotionalPrice || p.price).toFixed(2));
    setDeliveryDays(p.estimatedDeliveryDays || '4 a 8 dias úteis');
    setEditImagesText(p.images?.join('\n') || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);

    try {
      const costNum = parseCurrencyInput(supplierCost, 25);
      const priceNum = parseCurrencyInput(salePrice, selectedProduct.price);
      const imgList = editImagesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const persisted = await updateProductSupplier(selectedProduct.id, {
        name: editProductName.trim() || undefined,
        description: editDescription.trim() || undefined,
        categoryId: editCategoryId,
        isNew: editIsNew,
        isBestSeller: editIsBestSeller,
        isFeatured: editIsFeatured,
        supplierName: supplierName.trim(),
        supplierUrl: supplierUrl.trim(),
        supplierCost: costNum,
        price: priceNum,
        promotionalPrice: null,
        estimatedDeliveryDays: deliveryDays.trim(),
        images: imgList.length > 0 ? imgList : undefined,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === selectedProduct.id
            ? persisted ?? {
                ...item,
                name: editProductName.trim() || item.name,
                description: editDescription.trim() || item.description,
                categoryId: editCategoryId,
                category: categories.find((c) => c.id === editCategoryId) ?? item.category,
                isNew: editIsNew,
                isBestSeller: editIsBestSeller,
                isFeatured: editIsFeatured,
                price: priceNum,
                promotionalPrice: null,
                supplierName: supplierName.trim(),
                supplierUrl: supplierUrl.trim(),
                supplierCost: costNum,
                estimatedDeliveryDays: deliveryDays.trim(),
                images: imgList.length > 0 ? imgList : item.images,
              }
            : item
        )
      );

      setSelectedProduct(null);
      router.refresh();
      showToast('Produto atualizado.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar produto no banco.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Deseja remover o produto "${p.name}" da vitrine?`)) return;

    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      router.refresh();
      showToast(`Produto "${p.name}" removido.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir produto.');
    }
  };

  // Métricas
  const totalProducts = products.length;
  const shopeeCount = products.filter((p) => detectSupplierPlatform(p.supplierUrl, p.supplierName) === 'SHOPEE').length;
  const tiktokCount = products.filter((p) => detectSupplierPlatform(p.supplierUrl, p.supplierName) === 'TIKTOK').length;

  // Filtros
  const filteredProducts = products.filter((p) => {
    const plat = detectSupplierPlatform(p.supplierUrl, p.supplierName);
    if (platformFilter !== 'ALL' && plat !== platformFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.supplierName?.toLowerCase().includes(q) ||
        p.supplierUrl?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const parsedCost = parseCurrencyInput(importCost, 0);
  const parsedSale = parseCurrencyInput(importSalePrice, 0);
  const importProfit = Math.max(0, parsedSale - parsedCost);
  const importMarginPercent = parsedSale > 0 ? ((importProfit / parsedSale) * 100).toFixed(0) : '0';

  return (
    <div className="w-full bg-brand-background min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-brand-text">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-brand-text tracking-tight">
              Gerenciar Produtos
            </h1>
            <p className="text-xs text-brand-textMuted mt-1">
              Cadastre novos itens por link ou gerencie preços e estoque.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadProducts(true)}
              className="h-9 px-3 rounded-sm border border-brand-border bg-white hover:bg-brand-elevated text-xs font-semibold text-brand-text flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-9 px-4 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo produto</span>
            </button>
          </div>
        </div>

        {/* Barra de Importação por Link */}
        <div className="bg-white rounded border border-brand-border p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickLinkUrl.trim()) {
                handleExtractFromUrl(quickLinkUrl);
              } else {
                setIsImportModalOpen(true);
              }
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-brand-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickLinkUrl}
                onChange={(e) => setQuickLinkUrl(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text').trim();
                  if (/https?:\/\//i.test(pasted)) {
                    e.preventDefault();
                    setQuickLinkUrl(pasted);
                    void handleExtractFromUrl(pasted);
                  }
                }}
                placeholder="Cole o link do produto na Shopee ou TikTok Shop para cadastrar..."
                className="w-full h-10 pl-9 pr-3 rounded-sm bg-brand-background border border-brand-border text-xs text-brand-text placeholder:text-brand-textMuted focus:border-brand-text outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-5 rounded-sm bg-brand-text hover:bg-brand-accent text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar via link</span>
            </button>
          </form>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Total de produtos</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {totalProducts}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Shopee</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {shopeeCount}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">TikTok Shop</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {tiktokCount}
            </span>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded border border-brand-border p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'Todos', value: 'ALL' as const },
              { label: `Shopee (${shopeeCount})`, value: 'SHOPEE' as const },
              { label: `TikTok Shop (${tiktokCount})`, value: 'TIKTOK' as const },
              { label: 'Outros', value: 'OTHER' as const },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPlatformFilter(tab.value)}
                className={`px-3 py-1.5 rounded-sm text-xs transition-colors ${platformFilter === tab.value
                  ? 'bg-brand-text text-white font-medium'
                  : 'bg-brand-background text-brand-text hover:bg-brand-elevated'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou link..."
              className="w-full h-9 pl-8 pr-3 bg-brand-background border border-brand-border rounded-sm text-xs text-brand-text placeholder:text-brand-textMuted focus:border-brand-text outline-none"
            />
            <Search className="w-3.5 h-3.5 text-brand-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded border border-brand-border overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-brand-textMuted">Carregando produtos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-brand-textMuted">Nenhum produto encontrado.</div>
          ) : (
            <div className="divide-y divide-brand-border">
              {filteredProducts.map((p) => {
                const cost = p.supplierCost || 25;
                const sell = p.promotionalPrice || p.price;
                const profit = sell - cost;
                const marginPercent = sell > 0 ? ((profit / sell) * 100).toFixed(0) : '0';

                return (
                  <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-brand-background/40 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-14 h-16 rounded-sm bg-brand-background border border-brand-border overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-textMuted">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Link href={`/produto/${p.slug}`} target="_blank" className="hover:underline">
                          <h3 className="text-sm font-medium text-brand-text truncate">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-brand-textMuted">
                          <span>
                            {categories.find((c) => c.id === p.categoryId)?.name ||
                              p.category?.name ||
                              'Sem categoria'}
                          </span>
                          {p.isBestSeller && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-background border border-brand-border text-brand-text rounded-sm">
                              Mais vendido
                            </span>
                          )}
                          {p.isNew && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-brand-background border border-brand-border text-brand-text rounded-sm">
                              Lançamento
                            </span>
                          )}
                          {p.supplierName && (
                            <>
                              <span>•</span>
                              <span>{p.supplierName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-brand-border pt-3 sm:pt-0">
                      <div className="text-left sm:text-right text-xs tabular-nums">
                        <span className="text-brand-text font-semibold block">
                          R$ {sell.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-emerald-700 block">
                          Lucro: R$ {profit.toFixed(2).replace('.', ',')} ({marginPercent}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="h-8 px-3 rounded-sm border border-brand-border hover:border-brand-text text-xs text-brand-text font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="h-8 px-2.5 rounded-sm border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Excluir"
                          aria-label="Excluir produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Importar Produto */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded border border-brand-border max-w-xl w-full p-6 relative shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-medium text-brand-text">
              Cadastrar Produto via Link
            </h3>
            <p className="text-xs text-brand-textMuted mt-0.5">
              Informe o link do anúncio no fornecedor para vincular à sua loja.
            </p>

            {extractionFeedback && (
              <div className="mt-3 p-3 rounded-sm bg-brand-background border border-brand-border text-xs text-brand-text space-y-1.5">
                <p>{extractionFeedback}</p>
                <button
                  type="button"
                  onClick={() => setShowPasteHelper((prev) => !prev)}
                  className="text-[11px] font-semibold text-brand-text underline underline-offset-4 hover:text-brand-accent"
                >
                  {showPasteHelper
                    ? 'Ocultar campo de texto do anúncio'
                    : 'Colar texto copiado do anúncio (preenche preço e descrição)'}
                </button>
              </div>
            )}

            {showPasteHelper && (
              <div className="mt-3 p-3 rounded-sm bg-brand-background border border-dashed border-brand-border space-y-1.5">
                <label className="text-[11px] font-medium text-brand-text block">
                  Cole aqui o texto copiado da página da Shopee (incluindo o valor R$):
                </label>
                <textarea
                  rows={3}
                  value={pastedAdText}
                  onChange={(e) => handleParseCopiedText(e.target.value)}
                  placeholder="Ex: Colar Corrente Veneziana... R$ 34,90..."
                  className="w-full bg-white border border-brand-border rounded-sm p-2 text-xs text-brand-text focus:border-brand-text outline-none"
                />
              </div>
            )}

            <form onSubmit={handleCreateImportedProduct} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-brand-text block">
                    Link do Anúncio (Shopee ou TikTok Shop)
                  </label>
                  {!extractionFeedback && (
                    <button
                      type="button"
                      onClick={() => setShowPasteHelper((prev) => !prev)}
                      className="text-[11px] text-brand-textMuted hover:text-brand-text underline underline-offset-2"
                    >
                      {showPasteHelper ? 'Ocultar texto' : 'Colar texto com preço'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImportUrl(val);
                      const det = detectSupplierPlatform(val);
                      if (det !== 'OTHER') handleSelectPlatformPreset(det);
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').trim();
                      if (/https?:\/\//i.test(pasted)) {
                        e.preventDefault();
                        setImportUrl(pasted);
                        void handleExtractFromUrl(pasted);
                      }
                    }}
                    placeholder="https://shopee.com.br/..."
                    className="flex-1 h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                    required
                  />
                  <button
                    type="button"
                    disabled={extractingLink || !importUrl.trim()}
                    onClick={() => handleExtractFromUrl(importUrl)}
                    className="h-10 px-4 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {extractingLink ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Ex: Corrente Grumet 316L"
                  className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  required
                />
              </div>

              <ProductPlacementFields
                categories={categories}
                categoryId={importCategory}
                onCategoryChange={setImportCategory}
                isBestSeller={importIsBestSeller}
                onToggleBestSeller={() => setImportIsBestSeller((prev) => !prev)}
                isNew={importIsNew}
                onToggleNew={() => setImportIsNew((prev) => !prev)}
                isFeatured={importIsFeatured}
                onToggleFeatured={() => setImportIsFeatured((prev) => !prev)}
              />

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Descrição do Produto
                </label>
                <textarea
                  rows={3}
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  placeholder="Descrição extraída do anúncio ou detalhes da joia..."
                  className="w-full bg-white border border-brand-border rounded-sm p-2.5 text-xs text-brand-text leading-relaxed focus:border-brand-text outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="text"
                    value={importCost}
                    onChange={(e) => setImportCost(e.target.value)}
                    placeholder="29.90"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="text"
                    value={importSalePrice}
                    onChange={(e) => setImportSalePrice(e.target.value)}
                    placeholder="129.90"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-brand-background px-3 py-2 border border-brand-border">
                <span className="text-brand-textMuted">
                  Fornecedor: <strong className="text-brand-text">{importSupplierName}</strong> ({importPlatform})
                </span>
                <span className="font-semibold text-emerald-700 tabular-nums">
                  Lucro estimado: R$ {importProfit.toFixed(2).replace('.', ',')} ({importMarginPercent}%)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Tamanhos (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={importSizes}
                    onChange={(e) => setImportSizes(e.target.value)}
                    placeholder="40cm, 45cm, 50cm, 60cm, 70cm"
                    className="w-full h-9 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Acabamentos
                  </label>
                  <div className="flex items-center gap-1.5 h-9">
                    {(
                      [
                        { id: 'gold', label: 'Dourado' },
                        { id: 'silver', label: 'Prata' },
                        { id: 'black', label: 'Preto' },
                      ] as const
                    ).map((fin) => {
                      const active = importFinishes.includes(fin.id);
                      return (
                        <button
                          key={fin.id}
                          type="button"
                          onClick={() => toggleImportFinish(fin.id)}
                          className={`px-2.5 h-8 rounded-sm border text-[11px] font-medium transition-colors ${
                            active
                              ? 'bg-brand-text text-white border-brand-text'
                              : 'bg-white text-brand-textMuted border-brand-border hover:border-brand-text'
                          }`}
                        >
                          {fin.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Fotos do Produto (prévia automática + links ou arquivo)
                </label>

                {importImages.filter((u) => u.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {importImages
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="relative w-16 h-20 border border-brand-border bg-brand-background overflow-hidden group"
                        >
                          <img
                            src={imgUrl}
                            alt={`Prévia ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setImportImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/75 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remover foto"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <label className="h-8 px-3 rounded-sm bg-brand-background hover:bg-brand-elevated border border-brand-border text-brand-text text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files, 'import')}
                    />
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={importImages.join('\n')}
                  onChange={(e) => setImportImages(e.target.value.split('\n'))}
                  placeholder="https://..."
                  className="w-full bg-white border border-brand-border rounded-sm p-2 text-xs text-brand-text font-mono focus:border-brand-text outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="h-10 px-4 rounded-sm bg-brand-background hover:bg-brand-elevated text-xs font-medium text-brand-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={importingSaving}
                  className="h-10 px-5 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {importingSaving ? 'Salvando...' : 'Salvar produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Editar Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded border border-brand-border max-w-xl w-full p-6 relative shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-medium text-brand-text">
              Editar Produto
            </h3>
            <p className="text-xs text-brand-textMuted mt-0.5">
              {selectedProduct.name}
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  required
                />
              </div>

              <ProductPlacementFields
                categories={categories}
                categoryId={editCategoryId}
                onCategoryChange={setEditCategoryId}
                isBestSeller={editIsBestSeller}
                onToggleBestSeller={() => setEditIsBestSeller((prev) => !prev)}
                isNew={editIsNew}
                onToggleNew={() => setEditIsNew((prev) => !prev)}
                isFeatured={editIsFeatured}
                onToggleFeatured={() => setEditIsFeatured((prev) => !prev)}
              />

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-sm p-2.5 text-xs text-brand-text leading-relaxed focus:border-brand-text outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Link do Fornecedor (Shopee / TikTok)
                </label>
                <input
                  type="url"
                  value={supplierUrl}
                  onChange={(e) => setSupplierUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Custo no Fornecedor (R$)
                  </label>
                  <input
                    type="text"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    placeholder="25.00"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="text"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="129.90"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 font-mono text-xs text-brand-text focus:border-brand-text outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Fotos (URLs separadas por linha)
                </label>
                <textarea
                  rows={2}
                  value={editImagesText}
                  onChange={(e) => setEditImagesText(e.target.value)}
                  className="w-full bg-white border border-brand-border rounded-sm p-2 text-xs text-brand-text font-mono focus:border-brand-text outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="h-10 px-4 rounded-sm bg-brand-background hover:bg-brand-elevated text-xs font-medium text-brand-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-text text-white px-4 py-3 rounded-sm shadow-lg flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
