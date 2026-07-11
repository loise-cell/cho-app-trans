/** API base URL for Cloudflare Worker proxy. When set, OCR keys stay on the server. */
export function getApiBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!raw) {
    return null;
  }
  return raw.replace(/\/+$/, "");
}

export function useApiProxy(): boolean {
  return Boolean(getApiBaseUrl());
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("API base URL is not configured.");
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Optional Bearer token matching Worker secret API_SECRET. */
export function apiRequestHeaders(contentType = "application/json"): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  const secret = process.env.EXPO_PUBLIC_API_SECRET?.trim();
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}
