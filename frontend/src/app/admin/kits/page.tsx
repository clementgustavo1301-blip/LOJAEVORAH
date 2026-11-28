'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DEFAULT_KIT_SETTINGS,
  HARD_MAX_KIT_DISCOUNT_PERCENT,
  sanitizeKitSettings,
} from '@/lib/kit-pricing';
import type { KitSettings, KitTier } from '@/types';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

export default function AdminKitsPage() {
  const [settings, setSettings] = useState<KitSettings>(DEFAULT_KIT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/kit-settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.settings) {
          setSettings(sanitizeKitSettings(data.settings));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleTierChange = (index: number, field: keyof KitTier, rawValue: string) => {
    const parsed = Number(rawValue);
    setSettings((prev) => {
      const nextTiers = prev.tiers.map((tier, i) => {
        if (i !== index) return tier;
        if (field === 'minItems') {
          return { ...tier, minItems: Math.max(2, Math.min(prev.maxItems, Math.floor(parsed || 2))) };
        }
        return {
          ...tier,
          discountPercent: Math.max(
            0,
            Math.min(prev.maxDiscountPercent, HARD_MAX_KIT_DISCOUNT_PERCENT, parsed || 0)
          ),
        };
      });
      return { ...prev, tiers: nextTiers };
    });
  };

  const handleAddTier = () => {
    setSettings((prev) => {
      const highestMin = prev.tiers.reduce((acc, t) => Math.max(acc, t.minItems), prev.minItems - 1);
      const nextMin = Math.min(prev.maxItems, Math.max(prev.minItems, highestMin + 1));
      return {
        ...prev,
        tiers: [
          ...prev.tiers,
          {
            minItems: nextMin,
            discountPercent: Math.min(prev.maxDiscountPercent, HARD_MAX_KIT_DISCOUNT_PERCENT),
          },
        ],
      };
    });
  };

  const handleRemoveTier = (index: number) => {
    setSettings((prev) => {
      if (prev.tiers.length <= 1) return prev;
      return {
        ...prev,
        tiers: prev.tiers.filter((_, i) => i !== index),
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);

    try {
      const res = await fetch('/api/admin/kit-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar regras do kit.');
      }
      if (data.settings) {
        setSettings(sanitizeKitSettings(data.settings));
      }
      setFeedback({
        type: 'success',
        text: 'Regras de "Monte seu Kit" salvas e aplicadas imediatamente na loja e no checkout.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro inesperado ao salvar.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center gap-2 text-xs text-brand-textMuted">
        <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
        <span>Carregando configurações de kits...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            Promoções & Combos
          </span>
          <h1 className="text-xl font-semibold text-brand-text mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-gold" />
            <span>Configurar &ldquo;Monte seu Kit&rdquo;</span>
          </h1>
          <p className="text-xs text-brand-textMuted mt-1">
            Defina a quantidade de peças e as faixas de desconto progressivo (teto de segurança: até{' '}
            {HARD_MAX_KIT_DISCOUNT_PERCENT}% OFF).
          </p>
        </div>

        <Link
          href="/monte-seu-kit"
          target="_blank"
          className="h-9 px-3.5 border border-brand-border bg-white hover:border-brand-text text-xs font-medium text-brand-text inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Visualizar na loja</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Status e Apresentação */}
        <section className="bg-white border border-brand-border p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
                Status e Apresentação Editorial
              </h2>
              <p className="text-[11px] text-brand-textMuted mt-0.5">
                Controle se o construtor de kits está ativo para clientes.
              </p>
            </div>
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-medium text-brand-text">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 accent-[#0A0A0A]"
              />
              <span>{settings.enabled ? 'Ativo na loja' : 'Desativado'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="kit-title" className="block text-xs font-medium text-brand-text mb-1">
                Título da página
              </label>
              <input
                id="kit-title"
                type="text"
                maxLength={80}
                required
                value={settings.title}
                onChange={(e) => setSettings((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none"
              />
            </div>

            <div>
              <label htmlFor="kit-subtitle" className="block text-xs font-medium text-brand-text mb-1">
                Subtítulo
              </label>
              <textarea
                id="kit-subtitle"
                rows={2}
                maxLength={220}
                required
                value={settings.subtitle}
                onChange={(e) => setSettings((prev) => ({ ...prev, subtitle: e.target.value }))}
                className="w-full p-3 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* Limites e Regras de Margem */}
        <section className="bg-white border border-brand-border p-6 space-y-5">
          <div className="pb-3 border-b border-brand-border">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Limites de Peças e Teto de Desconto
            </h2>
            <p className="text-[11px] text-brand-textMuted mt-0.5">
              O banco de dados e o servidor garantem que o desconto de kit nunca ultrapasse{' '}
              {HARD_MAX_KIT_DISCOUNT_PERCENT}%.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="kit-min" className="block text-xs font-medium text-brand-text mb-1">
                Mínimo de peças
              </label>
              <input
                id="kit-min"
                type="number"
                min={2}
                max={5}
                value={settings.minItems}
                onChange={(e) => {
                  const val = Math.max(2, Math.min(5, Math.floor(Number(e.target.value) || 2)));
                  setSettings((prev) => ({
                    ...prev,
                    minItems: val,
                    maxItems: Math.max(val, prev.maxItems),
                  }));
                }}
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none"
              />
            </div>

            <div>
              <label htmlFor="kit-max" className="block text-xs font-medium text-brand-text mb-1">
                Máximo de peças
              </label>
              <input
                id="kit-max"
                type="number"
                min={settings.minItems}
                max={10}
                value={settings.maxItems}
                onChange={(e) => {
                  const val = Math.max(
                    settings.minItems,
                    Math.min(10, Math.floor(Number(e.target.value) || 5))
                  );
                  setSettings((prev) => ({ ...prev, maxItems: val }));
                }}
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none"
              />
            </div>

            <div>
              <label htmlFor="kit-cap" className="block text-xs font-medium text-brand-text mb-1">
                Teto máximo de desconto (%)
              </label>
              <input
                id="kit-cap"
                type="number"
                min={0}
                max={HARD_MAX_KIT_DISCOUNT_PERCENT}
                step="0.5"
                value={settings.maxDiscountPercent}
                onChange={(e) => {
                  const cap = Math.max(
                    0,
                    Math.min(HARD_MAX_KIT_DISCOUNT_PERCENT, Number(e.target.value) || 0)
                  );
                  setSettings((prev) => ({
                    ...prev,
                    maxDiscountPercent: cap,
                    tiers: prev.tiers.map((t) => ({
                      ...t,
                      discountPercent: Math.min(t.discountPercent, cap),
                    })),
                  }));
                }}
                className="w-full h-10 px-3 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Faixas Progressivas */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-text">
                Faixas Progressivas de Desconto
              </span>
              <button
                type="button"
                onClick={handleAddTier}
                className="h-8 px-3 border border-brand-border hover:border-brand-text text-[11px] font-medium text-brand-text inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar faixa</span>
              </button>
            </div>

            <div className="space-y-2">
              {settings.tiers.map((tier, idx) => (
                <div
                  key={`tier-${idx}`}
                  className="grid grid-cols-12 gap-3 items-center p-3 bg-brand-background border border-brand-border"
                >
                  <div className="col-span-5">
                    <label className="block text-[10px] uppercase tracking-wider text-brand-textMuted mb-1">
                      A partir de (peças)
                    </label>
                    <input
                      type="number"
                      min={settings.minItems}
                      max={settings.maxItems}
                      value={tier.minItems}
                      onChange={(e) => handleTierChange(idx, 'minItems', e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-brand-border text-xs text-brand-text tabular-nums outline-none focus:border-brand-text"
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[10px] uppercase tracking-wider text-brand-textMuted mb-1">
                      Desconto (% — máx. {settings.maxDiscountPercent}%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={settings.maxDiscountPercent}
                      step="0.5"
                      value={tier.discountPercent}
                      onChange={(e) => handleTierChange(idx, 'discountPercent', e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-brand-border text-xs text-brand-text tabular-nums outline-none focus:border-brand-text"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end pt-4">
                    <button
                      type="button"
                      disabled={settings.tiers.length <= 1}
                      onClick={() => handleRemoveTier(idx)}
                      className="p-2 text-brand-textMuted hover:text-red-700 disabled:opacity-30 transition-colors"
                      aria-label="Remover faixa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-brand-text cursor-pointer pt-2 border-t border-brand-border">
            <input
              type="checkbox"
              checked={settings.allowCouponStacking}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, allowCouponStacking: e.target.checked }))
              }
              className="w-4 h-4 accent-[#0A0A0A] mt-0.5"
            />
            <span>
              Permitir acumular cupom promocional em outros itens da sacola junto com kit{' '}
              <span className="text-brand-textMuted">
                (desmarcado = garante teto máximo de {settings.maxDiscountPercent}% sem acúmulo)
              </span>
            </span>
          </label>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-11 px-7 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-xs font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Salvando...' : 'Salvar configurações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
