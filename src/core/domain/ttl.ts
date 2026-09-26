import { CacheConfigurationError } from './cache-error.js';

export function assertValidTtl(ttl: number | undefined): void {
  if (ttl === undefined) return;
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new CacheConfigurationError(
      `Invalid TTL: ${ttl}. TTL must be > 0 seconds, or undefined for no expiration.`,
    );
  }
}

/**
 * Redis-compatible TTL result.
 *   >= 0 → remaining seconds
 *   -1   → key exists with no expiration
 *   -2   → key does not exist
 */
export type NormalizedTtl = number;

export const TTL_NO_EXPIRY: NormalizedTtl = -1;
export const TTL_MISSING: NormalizedTtl = -2;
