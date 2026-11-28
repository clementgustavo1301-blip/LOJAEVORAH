'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { sanitizeRedirectPath } from '@/lib/auth-roles';
import type { AuthMeResponse, CustomerProfile } from '@/types';

interface AuthContextValue {
  user: AuthMeResponse['user'];
  profile: CustomerProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  supabaseConfigured: boolean;
  refreshSession: () => Promise<AuthMeResponse | null>;
  updateLocalProfile: (profile: CustomerProfile) => void;
  signInWithGoogle: (nextPath?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthMeResponse['user']>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(isSupabaseConfigured());

  const refreshSession = useCallback(async (): Promise<AuthMeResponse | null> => {
    if (!isSupabaseConfigured()) {
      setSupabaseConfigured(false);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        return null;
      }
      const data = (await res.json()) as AuthMeResponse;
      setSupabaseConfigured(Boolean(data.supabaseConfigured));
      setUser(data.authenticated ? data.user : null);
      setProfile(data.authenticated ? data.profile : null);
      setIsAdmin(Boolean(data.authenticated && data.isAdmin));
      return data;
    } catch {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        void refreshSession();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refreshSession]);

  const updateLocalProfile = useCallback((nextProfile: CustomerProfile) => {
    setProfile(nextProfile);
  }, []);

  const signInWithGoogle = useCallback(async (nextPath = '/conta') => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: 'Autenticação Supabase ainda não configurada neste ambiente.' };
    }

    const safeNext = sanitizeRedirectPath(nextPath, '/conta');
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { error: 'Não foi possível iniciar o login com Google. Tente novamente.' };
    }

    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      isAdmin,
      loading,
      supabaseConfigured,
      refreshSession,
      updateLocalProfile,
      signInWithGoogle,
      signOut,
    }),
    [
      user,
      profile,
      isAdmin,
      loading,
      supabaseConfigured,
      refreshSession,
      updateLocalProfile,
      signInWithGoogle,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
