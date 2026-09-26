import type { Cache } from '../../core/port/cache.port.js';
import type { CacheSetOptions } from '../../core/domain/cache.types.js';
import { assertValidTtl } from '../../core/domain/ttl.js';

interface Entry {
  value: unknown;
  expiresAt: number | null; // null = no expiry
}

export interface MemoryCacheOptions {
  /**
   * Interval in ms for the periodic sweep of expired entries.
   * Default 60_000. Set to 0 to disable.
   */
  sweepIntervalMs?: number;
}

export class MemoryCache implements Cache {
  private readonly entries = new Map<string, Entry>();
  private sweeper: NodeJS.Timeout | null = null;

  constructor(
    private readonly namespace: string | undefined,
    options: MemoryCacheOptions = {},
  ) {
    const interval = options.sweepIntervalMs ?? 60_000;
    if (interval > 0) {
      this.sweeper = setInterval(() => this.sweep(), interval);
      this.sweeper.unref?.();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(this.physical(key));
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.entries.delete(this.physical(key));
      return null;
    }
    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    assertValidTtl(options?.ttl);
    const expiresAt =
      options?.ttl !== undefined ? Date.now() + options.ttl * 1000 : null;
    this.entries.set(this.physical(key), { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.entries.delete(this.physical(key));
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.entries.get(this.physical(key));
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.entries.delete(this.physical(key));
      return -2;
    }
    return remaining;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    assertValidTtl(ttlSeconds);
    const physical = this.physical(key);
    const entry = this.entries.get(physical);
    if (!entry) return false;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.entries.delete(physical);
      return false;
    }
    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  async clear(): Promise<void> {
    if (!this.namespace) {
      this.entries.clear();
      return;
    }
    const prefix = `${this.namespace}:`;
    for (const k of this.entries.keys()) {
      if (k.startsWith(prefix)) this.entries.delete(k);
    }
  }

  /**
   * Stops the periodic sweep. Call this on application shutdown.
   * Idempotent.
   */
  dispose(): void {
    if (this.sweeper) {
      clearInterval(this.sweeper);
      this.sweeper = null;
    }
  }

  // --- internals ---

  private physical(key: string): string {
    if (!this.namespace) return key;
    return `${this.namespace}:${key}`;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [k, entry] of this.entries) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.entries.delete(k);
      }
    }
  }
}
