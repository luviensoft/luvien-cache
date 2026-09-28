import { CacheConfigurationError } from './cache-error.js';
export function assertValidTtl(ttl) {
    if (ttl === undefined)
        return;
    if (!Number.isFinite(ttl) || ttl <= 0) {
        throw new CacheConfigurationError(`Invalid TTL: ${ttl}. TTL must be > 0 seconds, or undefined for no expiration.`);
    }
}
export const TTL_NO_EXPIRY = -1;
export const TTL_MISSING = -2;
//# sourceMappingURL=ttl.js.map