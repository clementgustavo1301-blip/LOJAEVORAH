'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import {
  TurnstileWidget,
  isTurnstileClientEnabled,
} from '@/components/security/turnstile-widget';
import { useAuth } from '@/context/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { sanitizeRedirectPath } from '@/lib/auth-roles';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

function EntrarFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, refreshSession } = useAuth();

  const nextPath = sanitizeRedirectPath(searchParams.get('next'), '/conta');
  const queryError = searchParams.get('error');
  const queryMessage = searchParams.get('mensagem');

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    queryError === 'autenticacao' || queryError === 'codigo_invalido'
      ? 'Não foi possível concluir a autenticação. Tente entrar novamente.'
      : null
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (honeypot.trim().length > 0) {
      setError('Requisição bloqueada pela verificação de segurança.');
      return;
    }

    if (isTurnstileClientEnabled && !captchaToken) {
      setError('Complete a verificação anti-robô antes de entrar.');
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

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (signInError || !data.session) {
        const msg = signInError?.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed')) {
          setError('Confirme seu e-mail através do link enviado na caixa de entrada antes de entrar.');
        } else if (msg.includes('captcha')) {
          setError('Verificação anti-robô expirada. Refaça a verificação e tente novamente.');
        } else {
          setError('E-mail ou senha incorretos. Confira seus dados e tente novamente.');
        }
        setCaptchaReset((v) => v + 1);
        setSubmitting(false);
        return;
      }

      await refreshSession();
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('Erro inesperado ao entrar. Tente novamente.');
      setCaptchaReset((v) => v + 1);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Bem-vindo de volta"
      title="Entrar na sua conta"
      subtitle="Acesse seus pedidos, códigos de rastreio, endereços salvos e lista de desejos."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Ainda não tem conta EVORAH?</span>
          <Link
            href={`/cadastro${nextPath !== '/conta' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
            className="text-brand-text font-semibold uppercase tracking-[0.14em] text-[11px] hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
          >
            <span>Criar conta gratuita</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      {queryMessage === 'senha_atualizada' && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>Senha redefinida com sucesso. Entre com sua nova senha.</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <GoogleAuthButton
        nextPath={nextPath}
        label="Continuar com Google"
        onError={(msg) => setError(msg)}
      />

      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-brand-border" />
        <span className="px-3 text-[10px] uppercase tracking-[0.18em] text-brand-textMuted font-medium">
          ou entre com e-mail
        </span>
        <div className="flex-1 border-t border-brand-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-brand-text mb-1.5">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-medium text-brand-text">
              Senha
            </label>
            <Link
              href="/recuperar-senha"
              className="text-[11px] text-brand-textMuted hover:text-brand-gold transition-colors underline underline-offset-4"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full h-11 px-3.5 pr-10 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-text p-1"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
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
          className="w-full h-11 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <span>Entrar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] bg-brand-background flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
        </div>
      }
    >
      <EntrarFormContent />
    </Suspense>
  );
}
