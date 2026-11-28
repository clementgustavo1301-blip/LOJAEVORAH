'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AccountOrdersTab } from '@/components/account/account-orders-tab';
import { AccountProfileTab } from '@/components/account/account-profile-tab';
import { AccountAddressesTab } from '@/components/account/account-addresses-tab';
import { AccountWishlistTab } from '@/components/account/account-wishlist-tab';
import {
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Shield,
  User,
} from 'lucide-react';

type AccountTab = 'pedidos' | 'dados' | 'enderecos' | 'favoritos';

const TABS: Array<{ id: AccountTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'pedidos', label: 'Meus Pedidos', icon: Package },
  { id: 'dados', label: 'Meus Dados', icon: User },
  { id: 'enderecos', label: 'Endereços', icon: MapPin },
  { id: 'favoritos', label: 'Favoritos', icon: Heart },
];

function ContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isAuthenticated, isAdmin, loading, supabaseConfigured, signOut } = useAuth();

  const rawTab = searchParams.get('aba') as AccountTab | null;
  const activeTab: AccountTab =
    rawTab && TABS.some((t) => t.id === rawTab) ? rawTab : 'pedidos';

  useEffect(() => {
    if (!loading && supabaseConfigured && !isAuthenticated) {
      router.replace('/entrar?next=/conta');
    }
  }, [loading, supabaseConfigured, isAuthenticated, router]);

  const handleSelectTab = (tab: AccountTab) => {
    router.replace(`/conta?aba=${tab}`, { scroll: false });
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="w-full min-h-[65vh] bg-brand-background flex items-center justify-center gap-3 text-xs text-brand-textMuted">
        <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
        <span>Carregando sua conta EVORAH...</span>
      </div>
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className="w-full min-h-[65vh] bg-brand-background py-16 px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-brand-border p-8 text-center space-y-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold block">
            Configuração Pendente
          </span>
          <h1 className="font-serif text-2xl text-brand-text">Área do Cliente</h1>
          <p className="text-xs text-brand-textMuted leading-relaxed">
            Configure as variáveis do Supabase (
            <code className="font-mono text-[11px] text-brand-text">NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
            <code className="font-mono text-[11px] text-brand-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            ) e execute a migration SQL em{' '}
            <code className="font-mono text-[11px] text-brand-text">
              supabase/migrations/20261128_customer_auth.sql
            </code>{' '}
            para ativar o login de clientes.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="w-full min-h-[65vh] bg-brand-background flex items-center justify-center gap-3 text-xs text-brand-textMuted">
        <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
        <span>Redirecionando para o login...</span>
      </div>
    );
  }

  const firstName =
    (profile?.fullName || user.email || 'Cliente').trim().split(/\s+/)[0] || 'Cliente';

  return (
    <div className="w-full flex-1 bg-brand-background">
      {/* Faixa Editorial Obsidian da Conta */}
      <section className="w-full bg-[#0A0A0A] text-[#FAF9F6] border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold block mb-2">
              Minha Conta EVORAH
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-white">
              Olá, {firstName}
            </h1>
            <p className="text-xs text-[#A3A7AE] mt-1.5">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/produtos"
                className="h-10 px-4 border border-brand-gold/60 text-brand-gold hover:bg-brand-gold hover:text-[#0A0A0A] text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Painel Admin</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="h-10 px-4 border border-white/25 hover:border-white text-[#FAF9F6] text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navegação Mobile (Horizontal Crisp Tabs) */}
      <div className="lg:hidden bg-white border-b border-brand-border px-4 py-3 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`shrink-0 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] border inline-flex items-center gap-2 transition-colors ${
                isActive
                  ? 'bg-[#0A0A0A] border-[#0A0A0A] text-brand-gold'
                  : 'bg-white border-brand-border text-brand-textMuted hover:text-brand-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Corpo Principal (3 cols Sidebar + 9 cols Content) */}
      <div className="max-w-[1240px] mx-auto px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-brand-border">
            <nav aria-label="Menu da conta" className="divide-y divide-brand-border">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full px-5 py-4 text-left text-xs uppercase tracking-[0.15em] flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white font-semibold'
                        : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-background font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 stroke-[1.5] ${
                          isActive ? 'text-brand-gold' : 'text-brand-textMuted'
                        }`}
                      />
                      <span>{tab.label}</span>
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 bg-brand-gold" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Conteúdo da Aba Ativa */}
          <section className="lg:col-span-9 min-w-0">
            {activeTab === 'pedidos' && <AccountOrdersTab />}
            {activeTab === 'dados' && <AccountProfileTab />}
            {activeTab === 'enderecos' && <AccountAddressesTab />}
            {activeTab === 'favoritos' && <AccountWishlistTab />}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ContaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[65vh] bg-brand-background flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand-gold" />
        </div>
      }
    >
      <ContaContent />
    </Suspense>
  );
}
