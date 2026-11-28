'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

function formatCpfInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function AccountProfileTab() {
  const { profile, updateLocalProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [cpf, setCpf] = useState(profile?.cpf || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setCpf(profile.cpf || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          cpf: cpf.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar dados.');
      }
      if (data.profile) {
        updateLocalProfile(data.profile);
      }
      setProfileMessage({
        type: 'success',
        text: 'Dados salvos com sucesso. Eles serão preenchidos automaticamente no próximo checkout.',
      });
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar perfil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error('Sessão Supabase indisponível.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw new Error(error.message || 'Não foi possível alterar a senha.');
      }
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Senha atualizada com sucesso.' });
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao atualizar senha.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-brand-border">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
          Cadastro Pessoal
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-brand-text mt-1">
          Meus Dados
        </h2>
        <p className="text-xs text-brand-textMuted mt-1">
          Mantenha seu perfil atualizado para agilizar o checkout e receber notificações de envio.
        </p>
      </div>

      {/* Formulário de Perfil */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-brand-border p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-brand-border">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Informações Pessoais
            </p>
            <p className="text-[11px] text-brand-textMuted mt-0.5">
              Acesso via {profile?.provider === 'google' ? 'Conta Google' : 'E-mail e senha'}
            </p>
          </div>

          {profile?.emailVerified && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              E-mail verificado
            </span>
          )}
        </div>

        {profileMessage && (
          <div
            className={`p-3.5 border text-xs flex items-start gap-2 ${
              profileMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {profileMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="profile-email" className="block text-xs font-medium text-brand-text mb-1.5">
              E-mail da conta
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full h-11 px-3.5 bg-brand-elevated border border-brand-border text-sm text-brand-textMuted cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="profile-name" className="block text-xs font-medium text-brand-text mb-1.5">
              Nome completo
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-xs font-medium text-brand-text mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              maxLength={15}
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="(00) 00000-0000"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="profile-cpf" className="block text-xs font-medium text-brand-text mb-1.5">
              CPF (para emissão de PIX / Nota)
            </label>
            <input
              id="profile-cpf"
              type="text"
              inputMode="numeric"
              maxLength={14}
              value={cpf}
              onChange={(e) => setCpf(formatCpfInput(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text tabular-nums focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="h-11 px-7 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{savingProfile ? 'Salvando...' : 'Salvar alterações'}</span>
          </button>
        </div>
      </form>

      {/* Segurança / Alterar Senha */}
      <form onSubmit={handleUpdatePassword} className="bg-white border border-brand-border p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-brand-border">
          <KeyRound className="w-4 h-4 text-brand-gold stroke-[1.5]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
              Segurança & Senha
            </p>
            <p className="text-[11px] text-brand-textMuted mt-0.5">
              Defina ou altere a senha de acesso por e-mail desta conta.
            </p>
          </div>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 border text-xs flex items-start gap-2 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="account-new-password" className="block text-xs font-medium text-brand-text mb-1.5">
              Nova senha
            </label>
            <input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="account-confirm-password" className="block text-xs font-medium text-brand-text mb-1.5">
              Confirmar nova senha
            </label>
            <input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="h-10 px-6 border border-brand-text bg-white hover:bg-[#0A0A0A] hover:text-white text-brand-text text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          {savingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{savingPassword ? 'Atualizando...' : 'Atualizar senha'}</span>
        </button>
      </form>
    </div>
  );
}
