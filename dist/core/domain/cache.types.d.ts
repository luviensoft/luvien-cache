export type CacheFailureMode = 'open' | 'closed';
export interface CacheSetOptions {
    ttl?: number;
}
export interface CacheRuntimeOptions {
    failureMode?: CacheFailureMode;
    namespace?: string;
}
//# sourceMappingURL=cache.types.d.ts.map