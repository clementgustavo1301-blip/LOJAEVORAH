'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          language?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

export const isTurnstileClientEnabled = Boolean(
  SITE_KEY && !SITE_KEY.includes('your-') && !SITE_KEY.includes('sua-chave')
);

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-evorah-turnstile="true"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile load error')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.evorahTurnstile = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile load error'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  resetSignal?: number;
  className?: string;
}

export function TurnstileWidget({
  onToken,
  resetSignal = 0,
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failedToLoad, setFailedToLoad] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!isTurnstileClientEnabled || !containerRef.current) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore cleanup errors
          }
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          language: 'pt-BR',
          callback: (token: string) => {
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            onTokenRef.current(null);
          },
          'error-callback': () => {
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailedToLoad(true);
          onTokenRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        onTokenRef.current(null);
      } catch {
        // Ignore reset errors
      }
    }
  }, [resetSignal]);

  if (!isTurnstileClientEnabled) {
    return null;
  }

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-textMuted">
        <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
        <span>Verificação de segurança</span>
      </div>
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center bg-brand-background/50 border border-brand-border p-1.5 overflow-x-auto"
      />
      {failedToLoad && (
        <p className="text-[11px] text-red-700">
          Não foi possível carregar a verificação anti-robô. Desative bloqueadores de script ou recarregue a página.
        </p>
      )}
    </div>
  );
}
