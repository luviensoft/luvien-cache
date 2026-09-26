import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { CACHE, type Cache } from '../core/port/cache.port.js';
import type { CacheSetOptions } from '../core/domain/cache.types.js';

@Injectable()
export class CacheService implements OnApplicationShutdown {
  constructor(@Inject(CACHE) private readonly cache: Cache) {}

  get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    return this.cache.set(key, value, options);
  }

  delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  exists(key: string): Promise<boolean> {
    return this.cache.exists(key);
  }

  ttl(key: string): Promise<number> {
    return this.cache.ttl(key);
  }

  expire(key: string, ttlSeconds: number): Promise<boolean> {
    return this.cache.expire(key, ttlSeconds);
  }

  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T> {
    return this.cache.getOrSet(key, factory, options);
  }

  clear(): Promise<void> {
    return this.cache.clear();
  }

  async onApplicationShutdown(): Promise<void> {
    const maybeDisposable = this.cache as unknown as {
      dispose?: () => Promise<void> | void;
    };
    if (typeof maybeDisposable.dispose === 'function') {
      await maybeDisposable.dispose();
    }
  }
}
