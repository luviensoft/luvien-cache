import { Redis } from 'ioredis';
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
import type { RedisCacheConfig } from './redis.config.js';

export class RedisCache implements Cache {
  private readonly client: Redis;
  private readonly namespace: string | undefined;
  private readonly failureMode: CacheFailureMode;
  private readonly prefix: string;

  constructor(
    config: RedisCacheConfig,
    namespace: string | undefined,
    failureMode: CacheFailureMode = 'open',
  ) {
    this.namespace = namespace;
    this.failureMode = failureMode;
    this.prefix = config.keyPrefix ?? 'luvien:cache:';

    this.client = new Redis(config.url, {
      password: config.password,
      db: config.db,
      keyPrefix: this.prefix,
      connectTimeout: config.connectTimeoutMs ?? 5000,
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 1,
      lazyConnect: false,
      enableReadyCheck: true,
    });

    this.client.on('error', () => {
      // Never crash the process. Errors surface on the next command.
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(this.physical(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
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
    const payload = JSON.stringify(value);
    try {
      if (options?.ttl !== undefined) {
        await this.client.set(this.physical(key), payload, 'EX', options.ttl);
      } else {
        await this.client.set(this.physical(key), payload);
      }
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
      const n = await this.client.del(this.physical(key));
      return n > 0;
    } catch (err) {
      return handleInfraError<boolean>(
        err,
        this.failureMode,
        `Failed to delete: ${key}`,
        false,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const n = await this.client.exists(this.physical(key));
      return n > 0;
    } catch (err) {
      return handleInfraError<boolean>(
        err,
        this.failureMode,
        `Failed to check existence: ${key}`,
        false,
      );
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const t = await this.client.ttl(this.physical(key));
      if (t === -2) return TTL_MISSING;
      if (t === -1) return TTL_NO_EXPIRY;
      return t;
    } catch (err) {
      return handleInfraError<number>(
        err,
        this.failureMode,
        `Failed to read TTL: ${key}`,
        TTL_MISSING,
      );
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    assertValidTtl(ttlSeconds);
    try {
      const n = await this.client.expire(this.physical(key), ttlSeconds);
      return n === 1;
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
    const pattern = this.namespace
      ? `${this.prefix}${this.namespace}:*`
      : `${this.prefix}*`;

    let cursor = '0';
    do {
      try {
        const [next, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        if (keys.length > 0) {
          const bare = keys.map((k) =>
            k.startsWith(this.prefix) ? k.slice(this.prefix.length) : k,
          );
          await this.client.del(...bare);
        }
      } catch (err) {
        handleInfraError<void>(
          err,
          this.failureMode,
          'Failed to clear namespaced keys',
          undefined,
        );
        return;
      }
    } while (cursor !== '0');
  }

  async dispose(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }

  private physical(key: string): string {
    if (!this.namespace) return key;
    return `${this.namespace}:${key}`;
  }
}
