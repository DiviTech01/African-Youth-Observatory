import { Injectable } from '@nestjs/common';

interface CacheEntry {
  data: unknown;
  expiry: number;
}

@Injectable()
export class CacheService {
  private store = new Map<string, CacheEntry>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  buildKey(prefix: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .map((k) => `${k}=${String(params[k])}`)
      .join('&');
    return `${prefix}:${sorted}`;
  }

  clear(): number {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  clearPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  stats(): { entries: number; bytes: number } {
    return {
      entries: this.store.size,
      bytes: 0, // approximation not needed for in-memory
    };
  }
}
