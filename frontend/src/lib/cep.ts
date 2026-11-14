export interface CepAddressResult {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

const cepCache = new Map<string, CepAddressResult>();

/** Formats a raw CEP string as 00000-000, keeping up to 8 digits. */
export function formatCepInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

async function fetchJsonWithTimeout<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  const combinedSignal =
    signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

  try {
    const res = await fetch(url, { signal: combinedSignal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchFromViaCep(digits: string, signal?: AbortSignal): Promise<CepAddressResult | null> {
  const data = await fetchJsonWithTimeout<Record<string, unknown>>(
    `https://viacep.com.br/ws/${digits}/json/`,
    signal
  );
  if (!data || data.erro) return null;

  return {
    cep: formatCepInput(String(data.cep || digits)),
    street: String(data.logradouro || '').trim(),
    neighborhood: String(data.bairro || '').trim(),
    city: String(data.localidade || '').trim(),
    state: String(data.uf || '').trim().toUpperCase(),
  };
}

async function fetchFromBrasilApi(digits: string, signal?: AbortSignal): Promise<CepAddressResult | null> {
  const data = await fetchJsonWithTimeout<Record<string, unknown>>(
    `https://brasilapi.com.br/api/cep/v2/${digits}`,
    signal
  );
  if (!data || !data.city) return null;

  return {
    cep: formatCepInput(String(data.cep || digits)),
    street: String(data.street || '').trim(),
    neighborhood: String(data.neighborhood || '').trim(),
    city: String(data.city || '').trim(),
    state: String(data.state || '').trim().toUpperCase(),
  };
}

/**
 * Resolves a Brazilian 8-digit CEP into street, neighborhood, city, and state.
 * Checks in-memory cache first, then queries ViaCEP with BrasilAPI fallback.
 */
export async function fetchAddressByCep(
  rawCep: string,
  signal?: AbortSignal
): Promise<CepAddressResult | null> {
  const digits = rawCep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const cached = cepCache.get(digits);
  if (cached) return cached;

  const viaCepResult = await fetchFromViaCep(digits, signal);
  if (viaCepResult) {
    cepCache.set(digits, viaCepResult);
    return viaCepResult;
  }

  if (signal?.aborted) return null;

  const brasilApiResult = await fetchFromBrasilApi(digits, signal);
  if (brasilApiResult) {
    cepCache.set(digits, brasilApiResult);
    return brasilApiResult;
  }

  return null;
}
