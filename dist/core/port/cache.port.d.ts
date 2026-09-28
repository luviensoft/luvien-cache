import type { CacheSetOptions } from '../domain/cache.types.js';
export declare const CACHE = "luvien:cache:cache";
export interface Cache {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
    clear(): Promise<void>;
}
//# sourceMappingURL=cache.port.d.ts.map