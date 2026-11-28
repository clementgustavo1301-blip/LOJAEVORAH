import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new LRUCache<string, RateLimitEntry>({
  max: 5000,
  ttl: 15 * 60 * 1000,
});

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const vercelIp = headers.get('x-vercel-forwarded-for');
  const cfIp = headers.get('cf-connecting-ip');
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  const raw = vercelIp || cfIp || forwarded || realIp || 'unknown';
  return raw.split(',')[0].trim().slice(0, 64) || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(params: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const key = `${params.scope}:${params.identifier}`;
  const current = rateLimitStore.get(key);

  if (!current || now >= current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + params.windowMs }, { ttl: params.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
    };
  }

  if (current.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  const nextCount = current.count + 1;
  const remainingTtl = Math.max(1000, current.resetAt - now);
  rateLimitStore.set(key, { count: nextCount, resetAt: current.resetAt }, { ttl: remainingTtl });

  return {
    allowed: true,
    remaining: Math.max(0, params.limit - nextCount),
    retryAfterSeconds: Math.ceil(remainingTtl / 1000),
  };
}

export function rateLimitExceededResponse(retryAfterSeconds: number, message?: string) {
  return NextResponse.json(
    {
      success: false,
      error:
        message ||
        'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

/**
 * Checks whether a hidden honeypot field was filled by an automated bot.
 */
export function isHoneypotTripped(body: Record<string, unknown> | null | undefined): boolean {
  if (!body || typeof body !== 'object') return false;
  const hp = body.website ?? body._hp_website ?? body.companyWebsite;
  return typeof hp === 'string' && hp.trim().length > 0;
}

/**
 * Verifies same-origin for browser state-changing requests (defense against CSRF).
 */
export function isTrustedSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Non-browser or same-origin calls without Origin header

  try {
    const reqUrl = new URL(req.url);
    const originUrl = new URL(origin);
    if (originUrl.origin === reqUrl.origin) return true;

    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configuredSite) {
      const siteUrl = new URL(configuredSite);
      if (originUrl.origin === siteUrl.origin) return true;
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function getTurnstileSecretKey(): string | null {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || secret.includes('your-') || secret.includes('sua-chave')) {
    return null;
  }
  return secret;
}

export function isTurnstileEnforcedOnServer(): boolean {
  return Boolean(getTurnstileSecretKey());
}

/**
 * Validates a Cloudflare Turnstile token on the server.
 * When TURNSTILE_SECRET_KEY is not configured, returns { ok: true, skipped: true }
 * so environments without Turnstile keys continue operating gracefully.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return { ok: true, skipped: true };
  }

  const cleanToken = String(token || '').trim();
  if (!cleanToken) {
    return {
      ok: false,
      error: 'Complete a verificação de segurança anti-robô antes de continuar.',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', cleanToken);
    if (remoteIp && remoteIp !== 'unknown') {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: 'Não foi possível validar a verificação anti-robô. Tente novamente.',
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data?.success) {
      return {
        ok: false,
        error: 'Verificação anti-robô expirada ou inválida. Refaça a verificação e tente novamente.',
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Falha ao comunicar com o serviço anti-robô. Tente novamente em instantes.',
    };
  }
}
