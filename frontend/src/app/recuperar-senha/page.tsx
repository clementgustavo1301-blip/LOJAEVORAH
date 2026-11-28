'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import {
  TurnstileWidget,
  isTurnstileClientEnabled,
} from '@/components/security/turnstile-widget';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (honeypot.trim().length > 0) {
      setError('Requisição bloqueada pela verificação de segurança.');
      return;
    }

    if (isTurnstileClientEnabled && !captchaToken) {
      setError('Complete a verificação anti-robô antes de continuar.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError('Autenticação Supabase não configurada neste ambiente.');
        setSubmitting(false);
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo, captchaToken: captchaToken || undefined }
      );

      if (resetError) {
        setError('Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes.');
        setCaptchaReset((v) => v + 1);
        setSubmitting(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Erro inesperado ao solicitar recuperação de senha.');
      setCaptchaReset((v) => v + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Recuperação de acesso"
      title="Redefinir senha"
      subtitle="Informe o e-mail cadastrado para receber um link seguro de criação de nova senha."
      footer={
        <Link
          href="/entrar"
          className="text-brand-text font-semibold uppercase tracking-[0.14em] text-[11px] hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para o login</span>
        </Link>
      }
    >
      {sent ? (
        <div className="p-6 bg-brand-background border border-brand-border space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Instruções enviadas</span>
          </div>
          <p className="text-xs text-brand-textMuted leading-relaxed">
            Se existir uma conta associada a <strong className="text-brand-text">{email}</strong>, você receberá em instantes um e-mail com o link para cadastrar uma nova senha.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="recover-email" className="block text-xs font-medium text-brand-text mb-1.5">
              E-mail cadastrado
            </label>
            <input
              id="recover-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>

          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="sr-only"
          />

          <TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando link...</span>
              </>
            ) : (
              <>
                <span>Enviar link de recuperação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
