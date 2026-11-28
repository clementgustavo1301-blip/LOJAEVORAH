'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CustomerAddress } from '@/types';
import { fetchAddressByCep, formatCepInput } from '@/lib/cep';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';

interface AddressFormState {
  label: string;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormState = {
  label: 'Casa',
  recipientName: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  isDefault: false,
};

export function AccountAddressesTab() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const cepAbortRef = useRef<AbortController | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/addresses', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
    return () => cepAbortRef.current?.abort();
  }, [loadAddresses]);

  const handleCepChange = async (rawValue: string) => {
    const formatted = formatCepInput(rawValue);
    const digits = formatted.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, cep: formatted }));
    setCepError(null);

    if (digits.length !== 8) {
      cepAbortRef.current?.abort();
      setLoadingCep(false);
      return;
    }

    cepAbortRef.current?.abort();
    const controller = new AbortController();
    cepAbortRef.current = controller;
    setLoadingCep(true);

    try {
      const result = await fetchAddressByCep(digits, controller.signal);
      if (controller.signal.aborted) return;
      if (!result) {
        setCepError('CEP não encontrado. Preencha manualmente.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        cep: result.cep,
        street: result.street,
        neighborhood: result.neighborhood,
        city: result.city,
        state: result.state,
      }));
    } finally {
      if (!controller.signal.aborted) {
        setLoadingCep(false);
      }
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setCepError(null);
    setFeedback(null);
    setFormOpen(true);
  };

  const openEditForm = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || 'Casa',
      recipientName: addr.recipientName || '',
      cep: addr.cep,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      isDefault: addr.isDefault,
    });
    setCepError(null);
    setFeedback(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const url = editingId
        ? `/api/account/addresses/${encodeURIComponent(editingId)}`
        : '/api/account/addresses';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar endereço.');
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadAddresses();
      setFeedback({
        type: 'success',
        text: editingId ? 'Endereço atualizado.' : 'Endereço adicionado com sucesso.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar endereço.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setFeedback(null);
    const res = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      await loadAddresses();
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);
    const res = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await loadAddresses();
      setFeedback({ type: 'success', text: 'Endereço removido.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            Entrega Rápida
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text mt-1">
            Endereços Salvos
          </h2>
        </div>

        {!formOpen && (
          <button
            type="button"
            onClick={openNewForm}
            className="h-10 px-5 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo endereço</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 border text-xs flex items-start gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-white border border-brand-border p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
              {editingId ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar formulário"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-label" className="block text-xs font-medium text-brand-text mb-1.5">
                Identificação (ex.: Casa, Trabalho)
              </label>
              <input
                id="addr-label"
                type="text"
                required
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Casa"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>

            <div>
              <label htmlFor="addr-recipient" className="block text-xs font-medium text-brand-text mb-1.5">
                Destinatário (opcional)
              </label>
              <input
                id="addr-recipient"
                type="text"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                placeholder="Nome de quem recebe"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="addr-cep" className="block text-xs font-medium text-brand-text mb-1.5">
                CEP
              </label>
              <div className="relative">
                <input
                  id="addr-cep"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  required
                  value={form.cep}
                  onChange={(e) => void handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className="w-full h-10 px-3 pr-8 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none"
                />
                {loadingCep && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-gold absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {cepError && <p className="text-[11px] text-red-600 mt-1">{cepError}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr-street" className="block text-xs font-medium text-brand-text mb-1.5">
                Rua / Avenida
              </label>
              <input
                id="addr-street"
                type="text"
                required
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Logradouro"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="addr-number" className="block text-xs font-medium text-brand-text mb-1.5">
                Número
              </label>
              <input
                id="addr-number"
                type="text"
                required
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="Nº"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>

            <div>
              <label htmlFor="addr-complement" className="block text-xs font-medium text-brand-text mb-1.5">
                Complemento
              </label>
              <input
                id="addr-complement"
                type="text"
                value={form.complement}
                onChange={(e) => setForm({ ...form, complement: e.target.value })}
                placeholder="Apto, bloco (opcional)"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="addr-neighborhood" className="block text-xs font-medium text-brand-text mb-1.5">
                Bairro
              </label>
              <input
                id="addr-neighborhood"
                type="text"
                required
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="Bairro"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
            <div>
              <label htmlFor="addr-city" className="block text-xs font-medium text-brand-text mb-1.5">
                Cidade
              </label>
              <input
                id="addr-city"
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Cidade"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
            <div>
              <label htmlFor="addr-state" className="block text-xs font-medium text-brand-text mb-1.5">
                Estado (UF)
              </label>
              <input
                id="addr-state"
                type="text"
                maxLength={2}
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                placeholder="SP"
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text uppercase focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-brand-text cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 accent-[#0A0A0A]"
            />
            <span>Definir como endereço principal para autopreenchimento no checkout</span>
          </label>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Salvando...' : 'Salvar endereço'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              className="h-10 px-5 border border-brand-border hover:border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white border border-brand-border p-10 flex items-center justify-center gap-2 text-xs text-brand-textMuted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
          <span>Carregando endereços...</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white border border-brand-border p-10 text-center space-y-3">
          <div className="w-10 h-10 bg-brand-background border border-brand-border flex items-center justify-center mx-auto text-brand-gold">
            <MapPin className="w-4 h-4 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-xl text-brand-text">Nenhum endereço salvo</h3>
          <p className="text-xs text-brand-textMuted max-w-sm mx-auto leading-relaxed">
            Salve seu endereço principal para finalizar suas próximas compras com um clique.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white border p-5 flex flex-col justify-between gap-4 ${
                addr.isDefault ? 'border-[#0A0A0A]' : 'border-brand-border'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#0A0A0A] text-brand-gold">
                      <Star className="w-2.5 h-2.5 fill-brand-gold" />
                      Principal
                    </span>
                  )}
                </div>

                {addr.recipientName && (
                  <p className="text-xs font-medium text-brand-text">{addr.recipientName}</p>
                )}
                <p className="text-xs text-brand-text leading-relaxed">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` — ${addr.complement}` : ''}
                </p>
                <p className="text-xs text-brand-textMuted">
                  {addr.neighborhood} • {addr.city}/{addr.state}
                </p>
                <p className="text-xs text-brand-textMuted tabular-nums">CEP {addr.cep}</p>
              </div>

              <div className="pt-3 border-t border-brand-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => void handleSetDefault(addr.id)}
                    className="font-semibold uppercase tracking-[0.12em] text-brand-text hover:text-brand-gold transition-colors"
                  >
                    Tornar principal
                  </button>
                ) : (
                  <span className="text-brand-textMuted">Usado no checkout</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    className="text-brand-textMuted hover:text-brand-text inline-flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(addr.id)}
                    className="text-brand-textMuted hover:text-red-700 inline-flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
