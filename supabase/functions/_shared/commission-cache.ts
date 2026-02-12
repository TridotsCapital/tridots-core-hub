// Commission calculation cache utility to avoid redundant calculations

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl: number; // in milliseconds
}

const cache = new Map<string, CacheEntry>();

export function getCacheKey(analysisId: string, type: string): string {
  return `commission:${analysisId}:${type}`;
}

export function isCacheExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

export function getCachedValue(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (isCacheExpired(entry)) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedValue(key: string, value: any, ttlMinutes: number = 60): void {
  cache.set(key, {
    value,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000,
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export function getCommissionCalculationKey(analysisId: string): string {
  return getCacheKey(analysisId, 'calculation');
}

export function getCommissionsListKey(agencyId: string, year: number, month?: number): string {
  return `commissions:${agencyId}:${year}:${month || 'all'}`;
}
