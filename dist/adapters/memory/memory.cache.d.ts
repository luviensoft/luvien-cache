import type { Cache } from '../../core/port/cache.port.js';
import type { CacheSetOptions } from '../../core/domain/cache.types.js';
export interface MemoryCacheOptions {
    sweepIntervalMs?: number;
}
export declare class MemoryCache implements Cache {
    private readonly namespace;
    private readonly entries;
    private sweeper;
    constructor(namespace: string | undefined, options?: MemoryCacheOptions);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
    clear(): Promise<void>;
    dispose(): void;
    private physical;
    private sweep;
}
//# sourceMappingURL=memory.cache.d.ts.map