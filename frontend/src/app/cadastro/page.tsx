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
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';

function CadastroFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, refreshSession } = useAuth();

  const nextPath = sanitizeRedirectPath(searchParams.get('next'), '/conta');
  const prefilledEmail = searchParams.get('email') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [authLoading, isAuthenticated, nextPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError('Informe seu nome completo.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    if (honeypot.trim().length > 0) {
      setError('Requisição bloqueada pela verificação de segurança.');
      return;
    }

    if (isTurnstileClientEnabled && !captchaToken) {
      setError('Complete a verificação anti-robô antes de criar sua conta.');
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

      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
          captchaToken: captchaToken || undefined,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setError('Este e-mail já possui uma conta cadastrada. Tente entrar ou recuperar sua senha.');
        } else if (msg.includes('captcha')) {
          setError('Verificação anti-robô expirada. Refaça a verificação e tente novamente.');
        } else {
          setError(signUpError.message || 'Não foi possível criar sua conta.');
        }
        setCaptchaReset((v) => v + 1);
        setSubmitting(false);
        return;
      }

      if (data.session) {
        await refreshSession();
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setConfirmationEmail(cleanEmail);
      setSubmitting(false);
    } catch {
      setError('Erro inesperado ao criar conta. Tente novamente.');
      setCaptchaReset((v) => v + 1);
      setSubmitting(false);
    }
  };

  if (confirmationEmail) {
    return (
      <AuthShell
        eyebrow="Confirmação necessária"
        title="Verifique seu e-mail"
        subtitle="Enviamos um link de confirmação para ativar sua conta EVORAH."
      >
        <div className="p-6 bg-brand-background border border-brand-border space-y-4">
          <div className="w-10 h-10 bg-[#0A0A0A] text-brand-gold flex items-center justify-center">
            <MailCheck className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-brand-text">
              Link enviado para {confirmationEmail}
            </p>
            <p className="text-xs text-brand-textMuted leading-relaxed">
              Abra sua caixa de entrada (ou spam) e clique no botão de confirmação. Assim que confirmar, compras anteriores feitas com este e-mail aparecerão automaticamente em <strong>Meus Pedidos</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/entrar?email=${encodeURIComponent(confirmationEmail)}`}
              className="h-10 px-5 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
            >
              <span>Ir para Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/produtos"
              className="h-10 px-5 border border-brand-border hover:border-brand-text text-brand-text text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center transition-colors"
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Novo cliente EVORAH"
      title="Criar sua conta"
      subtitle="Cadastre-se para acompanhar pedidos, salvar endereços e sincronizar seus favoritos."
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Já possui uma conta?</span>
          <Link
            href={`/entrar${nextPath !== '/conta' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
            className="text-brand-text font-semibold uppercase tracking-[0.14em] text-[11px] hover:text-brand-gold transition-colors inline-flex items-center gap-1.5"
          >
            <span>Entrar agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
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
        label="Cadastrar com Google"
        onError={(msg) => setError(msg)}
      />

      <div className="relative my-6 flex items-center">
        <div className="flex-1 border-t border-brand-border" />
        <span className="px-3 text-[10px] uppercase tracking-[0.18em] text-brand-textMuted font-medium">
          ou preencha seus dados
        </span>
        <div className="flex-1 border-t border-brand-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-xs font-medium text-brand-text mb-1.5">
            Nome completo
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Como gostaria de ser chamado(a)"
            className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-medium text-brand-text mb-1.5">
            E-mail
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="signup-password" className="block text-xs font-medium text-brand-text mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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

          <div>
            <label htmlFor="signup-confirm" className="block text-xs font-medium text-brand-text mb-1.5">
              Confirmar senha
            </label>
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full h-11 px-3.5 bg-brand-background border border-brand-border text-sm text-brand-text focus:border-brand-text focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        {password.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-brand-textMuted">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${password.length >= 6 ? 'text-emerald-700' : 'text-brand-border'}`}
            />
            <span>Mínimo de 6 caracteres</span>
          </div>
        )}

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

        <p className="text-[11px] text-brand-textMuted leading-relaxed">
          Ao criar sua conta, você concorda com nossa{' '}
          <Link href="/privacidade" className="underline hover:text-brand-text">
            Política de Privacidade (LGPD)
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-[#0A0A0A] hover:bg-brand-gold hover:text-[#0A0A0A] text-white text-[11px] font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Criando conta...</span>
            </>
          ) : (
            <>
              <span>Criar minha conta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] bg-brand-background flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
        </div>
      }
    >
      <CadastroFormContent />
    </Suspense>
  );
}
