import {
  DynamicModule,
  Module,
  type InjectionToken,
  type OptionalFactoryDependency,
  type Provider,
} from '@nestjs/common';

import { CACHE, type Cache } from '../core/port/cache.port.js';
import type { CacheFailureMode } from '../core/domain/cache.types.js';
import { JsonCacheSerializer } from '../core/domain/json-serializer.js';

import { MemoryCache } from '../adapters/memory/memory.cache.js';
import { MemcachedCache } from '../adapters/memcached/memcached.cache.js';
import type { MemcachedCacheConfig } from '../adapters/memcached/memcached.config.js';
import { RedisCache } from '../adapters/redis/redis.cache.js';
import type { RedisCacheConfig } from '../adapters/redis/redis.config.js';

import { CacheService } from './cache.service.js';
import { CACHE_OPTIONS } from './cache.constants.js';

export type CacheDriverConfig =
  | { driver: 'memory'; sweepIntervalMs?: number }
  | { driver: 'memcached'; memcached: MemcachedCacheConfig }
  | { driver: 'redis'; redis: RedisCacheConfig };

export interface CacheModuleOptions {
  driver: CacheDriverConfig;
  namespace?: string;
  failureMode?: CacheFailureMode;
}

export interface CacheModuleAsyncOptions<TArgs extends unknown[] = any[]> {
  imports?: unknown[];
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  useFactory: (
    ...args: TArgs
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
}

@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      providers: [
        { provide: CACHE_OPTIONS, useValue: options },
        ...buildProviders(),
      ],
      exports: [CACHE, CacheService],
    };
  }

  static forRootAsync<TArgs extends unknown[]>(
    options: CacheModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    const optionsProvider: Provider = {
      provide: CACHE_OPTIONS,
      useFactory: options.useFactory as (...args: unknown[]) => unknown,
      inject: (options.inject ?? []) as never[],
    };

    return {
      module: CacheModule,
      global: true,
      imports: (options.imports ?? []) as never[],
      providers: [optionsProvider, ...buildProviders()],
      exports: [CACHE, CacheService],
    };
  }
}

function buildProviders(): Provider[] {
  return [
    {
      provide: CACHE,
      useFactory: (options: CacheModuleOptions): Cache => {
        const namespace = options.namespace;
        const failureMode = options.failureMode ?? 'open';

        switch (options.driver.driver) {
          case 'memory':
            return new MemoryCache(namespace, {
              sweepIntervalMs: options.driver.sweepIntervalMs,
            });
          case 'memcached':
            return new MemcachedCache(
              options.driver.memcached,
              namespace,
              failureMode,
            );
          case 'redis':
            return new RedisCache(options.driver.redis, namespace, failureMode);
        }
      },
      inject: [CACHE_OPTIONS],
    },
    CacheService,
  ];
}
