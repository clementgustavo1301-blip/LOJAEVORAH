'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Store, Truck, LogOut, KeyRound, ExternalLink, X, Check } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  const [checkingAuth, setCheckingAuth] = useState(!isLoginPage);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    import('@/lib/supabase/client').then(({ getSupabaseBrowserClient, isSupabaseConfigured }) => {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            setUserEmail('admin@inox316l.com.br');
            setCheckingAuth(false);
          } else {
            router.replace('/admin/login');
          }
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase || !mounted) {
        if (mounted) router.replace('/admin/login');
        return;
      }

      fetch('/api/auth/me', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((me) => {
          if (!mounted) return;
          if (!me?.authenticated) {
            router.replace('/admin/login');
          } else if (!me.isAdmin) {
            router.replace('/conta');
          } else {
            setUserEmail(me.user?.email || 'Admin');
            setCheckingAuth(false);
          }
        })
        .catch(() => {
          if (mounted) {
            if (process.env.NODE_ENV !== 'production') {
              setCheckingAuth(false);
            } else {
              router.replace('/admin/login');
            }
          }
        });

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event: string, session: { user?: { email?: string } } | null) => {
          if (!session?.user && !isLoginPage) {
            router.replace('/admin/login');
          }
        }
      );
      unsubscribe = () => listener.subscription.unsubscribe();
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace('/admin/login');
    router.refresh();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus(`Erro: ${error.message}`);
    } else {
      setPasswordStatus('Senha atualizada com sucesso.');
      setNewPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordStatus(null);
      }, 1500);
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <span className="text-xs text-brand-textMuted">Carregando painel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background">
      {/* Barra Superior do Admin */}
      <header className="bg-brand-text text-white px-4 sm:px-6 lg:px-8 h-14 flex items-center border-b border-brand-border select-none">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs uppercase tracking-wider text-white">
              Painel
            </span>

            <nav className="flex items-center gap-1 text-xs">
              <Link
                href="/admin/produtos"
                className={`px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/admin/produtos')
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produtos</span>
              </Link>
              <Link
                href="/admin/fornecedores"
                className={`px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/admin/fornecedores')
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Fornecedores</span>
              </Link>
              <Link
                href="/admin/pedidos"
                className={`px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/admin/pedidos')
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Pedidos</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {userEmail && (
              <span className="hidden sm:inline-block text-white/60">
                {userEmail}
              </span>
            )}
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              title="Alterar senha"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Senha</span>
            </button>
            <Link
              href="/"
              className="px-2.5 py-1 rounded-sm bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              title="Ver loja"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver loja</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-sm bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors flex items-center gap-1"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Modal Alterar Senha */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border rounded-sm max-w-sm w-full p-6 relative shadow-xl">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-brand-textMuted hover:text-brand-text p-1"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-brand-text mb-1">
              Alterar Senha
            </h3>
            <p className="text-xs text-brand-textMuted mb-4">
              {userEmail}
            </p>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className="w-full h-10 px-3 rounded-sm border border-brand-border text-xs text-brand-text focus:border-brand-text outline-none"
              />
              {passwordStatus && (
                <p className="text-xs text-brand-text flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{passwordStatus}</span>
                </p>
              )}
              <button
                type="submit"
                className="w-full h-10 rounded-sm bg-brand-text text-white text-xs font-semibold uppercase tracking-wider hover:bg-brand-accent transition-colors"
              >
                Salvar senha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
