import type { Cache } from '../core/port/cache.port.js';
export interface CacheContractOptions {
    build(): Promise<Cache> | Cache;
    dispose?(cache: Cache): Promise<void>;
    supportsClear?: boolean;
    supportsExpire?: boolean;
    supportsRemainingTtl?: boolean;
}
export declare function describeCacheContract(name: string, options: CacheContractOptions): void;
//# sourceMappingURL=cache.contract.d.ts.map