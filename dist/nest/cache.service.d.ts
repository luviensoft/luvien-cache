import { OnApplicationShutdown } from '@nestjs/common';
import { type Cache } from '../core/port/cache.port.js';
import type { CacheSetOptions } from '../core/domain/cache.types.js';
export declare class CacheService implements OnApplicationShutdown {
    private readonly cache;
    constructor(cache: Cache);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
    clear(): Promise<void>;
    onApplicationShutdown(): Promise<void>;
}
//# sourceMappingURL=cache.service.d.ts.map