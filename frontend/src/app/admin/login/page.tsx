'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@inox316l.com.br');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    import('@/lib/supabase/client').then(({ getSupabaseBrowserClient }) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
        if (data.session) {
          router.replace('/admin/produtos');
        }
      });
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError('Configuração do Supabase não encontrada.');
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.session) {
        setError('E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      router.replace('/admin/produtos');
      router.refresh();
    } catch {
      setError('Erro ao autenticar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-brand-border rounded p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="vertical" color="black" className="mb-4" />
          <h1 className="text-base font-semibold text-brand-text">
            Acesso ao Painel
          </h1>
          <p className="text-xs text-brand-textMuted mt-1">
            Entre com suas credenciais de administrador.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-sm bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              className="w-full h-10 px-3 rounded-sm border border-brand-border bg-white text-xs text-brand-text focus:border-brand-text outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full h-10 px-3 pr-9 rounded-sm border border-brand-border bg-white text-xs text-brand-text focus:border-brand-text outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-text"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-sm bg-brand-text text-white hover:bg-brand-accent disabled:opacity-60 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-brand-border text-center text-xs text-brand-textMuted">
          <Link href="/" className="hover:text-brand-text underline">
            Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
