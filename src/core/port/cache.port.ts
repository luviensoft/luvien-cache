import type { CacheSetOptions } from '../domain/cache.types.js';

export const CACHE = 'luvien:cache:cache';

export interface Cache {
  get<T>(key: string): Promise<T | null>;

  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;

  delete(key: string): Promise<boolean>;

  exists(key: string): Promise<boolean>;

  /**
   * @returns remaining seconds (>= 0), -1 (no expiry), -2 (missing)
   */
  ttl(key: string): Promise<number>;

  expire(key: string, ttlSeconds: number): Promise<boolean>;

  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T>;

  /**
   * Delete every key under the configured namespace.
   * MUST NOT clear unrelated data.
   */
  clear(): Promise<void>;
}
