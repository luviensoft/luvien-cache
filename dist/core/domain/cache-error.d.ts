export declare class CacheError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export declare class CacheConfigurationError extends CacheError {
}
export declare class CacheConnectionError extends CacheError {
}
export declare class CacheSerializationError extends CacheError {
}
export declare class CacheOperationError extends CacheError {
}
//# sourceMappingURL=cache-error.d.ts.map