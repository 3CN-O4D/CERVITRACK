const CACHE_PREFIX = 'cervitrack_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function cacheGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (expires && Date.now() > expires) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data as T;
  } catch { return null; }
}

export function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      expires: ttl > 0 ? Date.now() + ttl : null,
    }));
  } catch { /* quota exceeded — silent */ }
}

export function cacheRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function cacheClear(): void {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

// Cached fetch: tries network first, falls back to cache
export async function cachedFetch<T>(key: string, url: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
  // Try network first
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json() as T;
      cacheSet(key, data, ttl);
      return data;
    }
  } catch { /* fall through to cache */ }
  // Fall back to cache
  return cacheGet<T>(key);
}

// Service worker registration
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — silent
    });
  });
}
