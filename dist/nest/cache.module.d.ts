import { DynamicModule, type InjectionToken, type OptionalFactoryDependency } from '@nestjs/common';
import type { CacheFailureMode } from '../core/domain/cache.types.js';
import type { MemcachedCacheConfig } from '../adapters/memcached/memcached.config.js';
import type { RedisCacheConfig } from '../adapters/redis/redis.config.js';
export type CacheDriverConfig = {
    driver: 'memory';
    sweepIntervalMs?: number;
} | {
    driver: 'memcached';
    memcached: MemcachedCacheConfig;
} | {
    driver: 'redis';
    redis: RedisCacheConfig;
};
export interface CacheModuleOptions {
    driver: CacheDriverConfig;
    namespace?: string;
    failureMode?: CacheFailureMode;
}
export interface CacheModuleAsyncOptions<TArgs extends unknown[] = any[]> {
    imports?: unknown[];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: TArgs) => Promise<CacheModuleOptions> | CacheModuleOptions;
}
export declare class CacheModule {
    static forRoot(options: CacheModuleOptions): DynamicModule;
    static forRootAsync<TArgs extends unknown[]>(options: CacheModuleAsyncOptions<TArgs>): DynamicModule;
}
//# sourceMappingURL=cache.module.d.ts.map