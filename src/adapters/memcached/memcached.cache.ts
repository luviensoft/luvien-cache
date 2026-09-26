import Memcached from 'memcached';
import type { Cache } from '../../core/port/cache.port.js';
import type {
  CacheSetOptions,
  CacheFailureMode,
} from '../../core/domain/cache.types.js';
import {
  assertValidTtl,
  TTL_MISSING,
  TTL_NO_EXPIRY,
} from '../../core/domain/ttl.js';
import { handleInfraError } from '../../core/domain/failure.js';
import type { MemcachedCacheConfig } from './memcached.config.js';

const MEMCACHED_MAX_TTL = 30 * 24 * 60 * 60; // 30 days

export class MemcachedCache implements Cache {
  private readonly client: Memcached;
  private readonly namespace: string | undefined;
  private readonly failureMode: CacheFailureMode;
  private readonly prefix: string;

  constructor(
    config: MemcachedCacheConfig,
    namespace: string | undefined,
    failureMode: CacheFailureMode = 'open',
  ) {
    this.namespace = namespace;
    this.failureMode = failureMode;
    this.prefix = config.keyPrefix ?? 'luvien:cache:';

    this.client = new Memcached(config.servers, {
      timeout: config.timeoutMs ?? 5000,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.call<unknown>('get', this.physical(key));
      if (raw === undefined || raw === null) return null;
      return raw as T;
    } catch (err) {
      return handleInfraError<T | null>(
        err,
        this.failureMode,
        `Failed to get: ${key}`,
        null,
      );
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void> {
    assertValidTtl(options?.ttl);
    const ttl = options?.ttl ?? 0;
    if (ttl > MEMCACHED_MAX_TTL) {
      throw new Error(
        `TTL ${ttl}s exceeds Memcached max of ${MEMCACHED_MAX_TTL}s`,
      );
    }
    try {
      await this.call('set', this.physical(key), value, ttl);
    } catch (err) {
      handleInfraError<void>(
        err,
        this.failureMode,
        `Failed to set: ${key}`,
        undefined,
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.call('delete', this.physical(key));
      return true;
    } catch (err) {
      if ((err as Error)?.message?.includes('NOT_FOUND')) return false;
      return handleInfraError<boolean>(
        err,
        this.failureMode,
        `Failed to delete: ${key}`,
        false,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    const v = await this.get(key);
    return v !== null;
  }

  async ttl(key: string): Promise<number> {
    // Memcached does not expose remaining TTL.
    // Return -1 if present, -2 if missing.
    const present = await this.exists(key);
    return present ? TTL_NO_EXPIRY : TTL_MISSING;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    assertValidTtl(ttlSeconds);
    try {
      const value = await this.call<unknown>('get', this.physical(key));
      if (value === undefined) return false;
      await this.call('set', this.physical(key), value, ttlSeconds);
      return true;
    } catch (err) {
      return handleInfraError<boolean>(
        err,
        this.failureMode,
        `Failed to set expiry: ${key}`,
        false,
      );
    }
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
    throw new Error(
      'MemcachedCache.clear() is not supported. Memcached has no namespaced bulk delete. ' +
        'Use a namespace-aware eviction strategy in the application.',
    );
  }

  async dispose(): Promise<void> {
    this.client.end();
  }

  // --- internals ---

  private physical(key: string): string {
    if (!this.namespace) return `${this.prefix}${key}`;
    return `${this.prefix}${this.namespace}:${key}`;
  }

  private call<T = unknown>(method: string, ...args: unknown[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const fn = (
        this.client as unknown as Record<string, (...a: unknown[]) => unknown>
      )[method];

      if (typeof fn !== 'function') {
        reject(new Error(`Unknown Memcached method: ${method}`));
        return;
      }

      fn.call(this.client, ...args, (err: Error | null, result: T) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}
