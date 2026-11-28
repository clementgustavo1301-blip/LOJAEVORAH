import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

/**
 * Returns normalized list of admin emails configured via ADMIN_EMAILS env var.
 * Server-side only (process.env.ADMIN_EMAILS is never exposed to the browser).
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.includes('@'));
}

export function isEmailInAdminAllowlist(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

/**
 * Checks email verification using ONLY server-controlled Supabase Auth fields.
 * Never trusts user-editable user_metadata claims.
 */
export function isEmailVerifiedUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email_confirmed_at || user.confirmed_at) return true;
  if (user.app_metadata?.provider === 'google') return true;
  return false;
}

export function isAdminUser(
  user: User | null | undefined,
  profileRole?: string | null
): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  if (profileRole === 'admin') return true;
  if (isEmailVerifiedUser(user) && isEmailInAdminAllowlist(user.email)) return true;
  return false;
}

export function resolveUserRole(
  user: User | null | undefined,
  profileRole?: string | null
): UserRole {
  return isAdminUser(user, profileRole) ? 'admin' : 'customer';
}

/**
 * Prevents open redirects by allowing only relative same-origin paths.
 */
export function sanitizeRedirectPath(
  rawPath?: string | null,
  fallback = '/conta'
): string {
  if (!rawPath) return fallback;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;
  return trimmed;
}

export function isValidCpfDigits(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calcDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  return calcDigit(9) === Number(digits[9]) && calcDigit(10) === Number(digits[10]);
}
