import type { Cache } from '../../core/port/cache.port.js';
import type { CacheSetOptions, CacheFailureMode } from '../../core/domain/cache.types.js';
import type { RedisCacheConfig } from './redis.config.js';
export declare class RedisCache implements Cache {
    private readonly client;
    private readonly namespace;
    private readonly failureMode;
    private readonly prefix;
    constructor(config: RedisCacheConfig, namespace: string | undefined, failureMode?: CacheFailureMode);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
    clear(): Promise<void>;
    dispose(): Promise<void>;
    private physical;
}
//# sourceMappingURL=redis.cache.d.ts.map