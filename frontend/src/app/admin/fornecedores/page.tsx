'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, Supplier, SupplierPlatform } from '@/types';
import {
  buildWhatsAppHref,
  CARRIER_OPTIONS,
  deleteStoredSupplier,
  detectSupplierPlatform,
  getStoredSuppliers,
  resolveSupplierPreset,
  SUPPLIER_PLATFORM_META,
  upsertStoredSupplier,
} from '@/lib/suppliers';
import { fetchProducts, getStoredProductsSnapshot } from '@/lib/api';
import {
  Check,
  Edit3,
  ExternalLink,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Search,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

const PLATFORM_OPTIONS: SupplierPlatform[] = [
  'DIRECT',
  'MERCADOLIVRE',
  'SHOPEE',
  'TIKTOK',
  'ALIEXPRESS',
  'SHEIN',
  'TEMU',
  'OTHER',
];

export default function AdminFornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DIRECT' | 'MARKETPLACE'>('ALL');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Modal Cadastro / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState('');
  const [formPlatform, setFormPlatform] = useState<SupplierPlatform>('DIRECT');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCarrier, setFormCarrier] = useState('Correios');
  const [formDeliveryDays, setFormDeliveryDays] = useState('2 a 5 dias úteis');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    setSuppliers(getStoredSuppliers());
    const localProds = getStoredProductsSnapshot();
    if (localProds.length > 0) setProducts(localProds);
    fetchProducts()
      .then((list) => setProducts(list))
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openCreateModal = () => {
    const preset = resolveSupplierPreset('DIRECT');
    setEditingSupplier(null);
    setFormName('');
    setFormPlatform('DIRECT');
    setFormWebsiteUrl('');
    setFormWhatsapp('');
    setFormEmail('');
    setFormCarrier(preset.defaultCarrier);
    setFormDeliveryDays(preset.defaultDeliveryDays);
    setFormNotes('');
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormPlatform(supplier.platform);
    setFormWebsiteUrl(supplier.websiteUrl || '');
    setFormWhatsapp(supplier.whatsapp || '');
    setFormEmail(supplier.email || '');
    setFormCarrier(supplier.defaultCarrier || 'Correios');
    setFormDeliveryDays(supplier.estimatedDeliveryDays || '3 a 7 dias úteis');
    setFormNotes(supplier.notes || '');
    setFormIsActive(supplier.isActive);
    setModalOpen(true);
  };

  const handlePlatformChange = (nextPlatform: SupplierPlatform) => {
    setFormPlatform(nextPlatform);
    if (!editingSupplier) {
      const preset = resolveSupplierPreset(nextPlatform);
      setFormCarrier(preset.defaultCarrier);
      setFormDeliveryDays(preset.defaultDeliveryDays);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const saved = upsertStoredSupplier({
      id: editingSupplier?.id,
      name: formName,
      platform: formPlatform,
      websiteUrl: formWebsiteUrl,
      whatsapp: formWhatsapp,
      email: formEmail,
      defaultCarrier: formCarrier,
      estimatedDeliveryDays: formDeliveryDays,
      notes: formNotes,
      isActive: formIsActive,
    });

    setSuppliers(getStoredSuppliers());
    setModalOpen(false);
    showToast(
      editingSupplier
        ? `Fornecedor "${saved.name}" atualizado.`
        : `Fornecedor "${saved.name}" cadastrado.`
    );
  };

  const handleDelete = (supplier: Supplier) => {
    if (!window.confirm(`Remover o fornecedor "${supplier.name}" da lista?`)) return;
    const remaining = deleteStoredSupplier(supplier.id);
    setSuppliers(remaining);
    showToast(`Fornecedor "${supplier.name}" removido.`);
  };

  const isDirectSupplier = (s: Supplier) => s.platform === 'DIRECT' || s.platform === 'OTHER';

  const countLinkedProducts = (supplier: Supplier) => {
    const cleanName = supplier.name.trim().toLowerCase();
    return products.filter((p) => {
      const matchName = (p.supplierName || '').trim().toLowerCase() === cleanName;
      const matchPlat =
        p.supplierPlatform === supplier.platform ||
        detectSupplierPlatform(p.supplierUrl, p.supplierName) === supplier.platform;
      return matchName || (cleanName.includes(supplier.platform.toLowerCase()) && matchPlat);
    }).length;
  };

  const totalCount = suppliers.length;
  const directCount = suppliers.filter(isDirectSupplier).length;
  const marketplaceCount = totalCount - directCount;

  const filteredSuppliers = suppliers.filter((s) => {
    if (typeFilter === 'DIRECT' && !isDirectSupplier(s)) return false;
    if (typeFilter === 'MARKETPLACE' && isDirectSupplier(s)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.websiteUrl || '').toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q) ||
        SUPPLIER_PLATFORM_META[s.platform].label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full bg-brand-background min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-brand-text">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-brand-text tracking-tight">
              Fornecedores &amp; Parceiros
            </h1>
            <p className="text-xs text-brand-textMuted mt-1">
              Centralize fabricantes diretos, atacadistas e marketplaces usados nos seus produtos e envios.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="h-9 px-4 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo fornecedor</span>
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Total cadastrados</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {totalCount}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Diretos / Atacado</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {directCount}
            </span>
          </div>

          <div className="bg-white rounded border border-brand-border p-4">
            <span className="text-xs text-brand-textMuted block">Marketplaces</span>
            <span className="text-2xl font-semibold text-brand-text font-mono mt-1 block tabular-nums">
              {marketplaceCount}
            </span>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded border border-brand-border p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: `Todos (${totalCount})`, value: 'ALL' as const },
              { label: `Diretos / Atacado (${directCount})`, value: 'DIRECT' as const },
              { label: `Marketplaces (${marketplaceCount})`, value: 'MARKETPLACE' as const },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`px-3 py-1.5 rounded-sm text-xs transition-colors ${
                  typeFilter === tab.value
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
              placeholder="Buscar fornecedor, site ou nota..."
              className="w-full h-9 pl-8 pr-3 bg-brand-background border border-brand-border rounded-sm text-xs text-brand-text placeholder:text-brand-textMuted focus:border-brand-text outline-none"
            />
            <Search className="w-3.5 h-3.5 text-brand-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Lista de Fornecedores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded border border-brand-border p-12 text-center text-xs text-brand-textMuted">
              Nenhum fornecedor encontrado com os filtros atuais.
            </div>
          ) : (
            filteredSuppliers.map((supplier) => {
              const meta = SUPPLIER_PLATFORM_META[supplier.platform] || SUPPLIER_PLATFORM_META.OTHER;
              const waHref = buildWhatsAppHref(supplier.whatsapp);
              const linkedCount = countLinkedProducts(supplier);

              return (
                <div
                  key={supplier.id}
                  className="bg-white rounded border border-brand-border p-5 flex flex-col justify-between gap-4 hover:border-brand-text/40 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm bg-brand-background border border-brand-border text-brand-text">
                            {meta.shortLabel}
                          </span>
                          {!supplier.isActive && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 border border-zinc-200">
                              Inativo
                            </span>
                          )}
                        </div>
                        <h2 className="font-serif text-lg font-medium text-brand-text mt-2">
                          {supplier.name}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(supplier)}
                          className="h-8 px-2.5 rounded-sm border border-brand-border hover:border-brand-text text-xs text-brand-text font-medium flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(supplier)}
                          aria-label={`Remover ${supplier.name}`}
                          className="h-8 px-2 rounded-sm border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-brand-background/70 border border-brand-border p-3 rounded-sm">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-brand-textMuted block">
                          Transportadora padrão
                        </span>
                        <span className="font-medium text-brand-text flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span className="truncate">{supplier.defaultCarrier}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-brand-textMuted block">
                          Prazo estimado
                        </span>
                        <span className="font-medium text-brand-text mt-0.5 block">
                          {supplier.estimatedDeliveryDays}
                        </span>
                      </div>
                    </div>

                    {supplier.notes && (
                      <p className="text-xs text-brand-textMuted leading-relaxed">
                        {supplier.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-brand-textMuted">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{linkedCount}</span> produto(s)
                      </span>
                      {supplier.email && (
                        <a
                          href={`mailto:${supplier.email}`}
                          className="flex items-center gap-1 hover:text-brand-text transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{supplier.email}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/produtos?supplierId=${encodeURIComponent(supplier.id)}`}
                      className="h-8 px-3 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo produto</span>
                    </Link>

                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 rounded-sm bg-emerald-50 border border-emerald-200 hover:border-emerald-500 text-emerald-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {supplier.websiteUrl && (
                      <a
                        href={supplier.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 rounded-sm bg-brand-background border border-brand-border hover:border-brand-text text-brand-text text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-brand-textMuted" />
                        <span>Catálogo</span>
                        <ExternalLink className="w-3 h-3 text-brand-textMuted" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Adicionar / Editar Fornecedor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded border border-brand-border max-w-lg w-full p-6 relative shadow-xl my-8">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg font-medium text-brand-text">
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h3>
            <p className="text-xs text-brand-textMuted mt-0.5">
              Cadastre fabricantes próprios, atacadistas ou outros marketplaces.
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Nome do Fornecedor / Fábrica / Loja
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Distribuidora Prata & Inox SP"
                  className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Tipo / Origem
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value as SupplierPlatform)}
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  >
                    {PLATFORM_OPTIONS.map((plat) => (
                      <option key={plat} value={plat}>
                        {SUPPLIER_PLATFORM_META[plat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Link do Catálogo ou Site (opcional)
                  </label>
                  <input
                    type="url"
                    value={formWebsiteUrl}
                    onChange={(e) => setFormWebsiteUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    WhatsApp de Contato (opcional)
                  </label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    E-mail Comercial (opcional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="comercial@fornecedor.com.br"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Transportadora Padrão
                  </label>
                  <select
                    value={CARRIER_OPTIONS.includes(formCarrier) ? formCarrier : 'Outra'}
                    onChange={(e) => {
                      if (e.target.value !== 'Outra') setFormCarrier(e.target.value);
                    }}
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  >
                    {CARRIER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-brand-text block mb-1">
                    Prazo Estimado de Envio
                  </label>
                  <input
                    type="text"
                    required
                    value={formDeliveryDays}
                    onChange={(e) => setFormDeliveryDays(e.target.value)}
                    placeholder="Ex: 2 a 5 dias úteis"
                    className="w-full h-10 bg-white border border-brand-border rounded-sm px-3 text-xs text-brand-text focus:border-brand-text outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text block mb-1">
                  Observações / Condições (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Pedido mínimo, chave PIX, prazo de despacho, CNPJ..."
                  className="w-full bg-white border border-brand-border rounded-sm p-2.5 text-xs text-brand-text focus:border-brand-text outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-brand-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-sm border-brand-border"
                />
                <span>Fornecedor ativo para novos produtos</span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-4 rounded-sm bg-brand-background hover:bg-brand-elevated text-xs font-medium text-brand-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-sm bg-brand-text text-white hover:bg-brand-accent text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  {editingSupplier ? 'Salvar alterações' : 'Cadastrar fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-text text-white px-4 py-3 rounded-sm shadow-lg flex items-center gap-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
