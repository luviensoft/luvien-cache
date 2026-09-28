import { CacheError, CacheOperationError, CacheSerializationError, } from './cache-error.js';
export function handleInfraError(err, mode, context, fallback) {
    if (err instanceof CacheSerializationError)
        throw err;
    if (mode === 'closed') {
        if (err instanceof CacheError)
            throw err;
        throw new CacheOperationError(context, err);
    }
    return fallback;
}
//# sourceMappingURL=failure.js.map