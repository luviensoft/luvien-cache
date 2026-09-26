import {
  CacheError,
  CacheOperationError,
  CacheSerializationError,
} from './cache-error.js';
import type { CacheFailureMode } from './cache.types.js';

/**
 * Apply the cache failure-mode policy to an infrastructure error.
 *
 * - Serialization errors ALWAYS propagate, regardless of mode.
 * - 'closed': throw the original error (or wrap in CacheOperationError).
 * - 'open':   return the fallback value.
 *
 * The fallback is a value, not a function. The generic T is inferred from
 * the fallback argument and returned as-is.
 */
export function handleInfraError<T>(
  err: unknown,
  mode: CacheFailureMode,
  context: string,
  fallback: T,
): T {
  // Serialization errors are bugs, not misses.
  if (err instanceof CacheSerializationError) throw err;

  if (mode === 'closed') {
    if (err instanceof CacheError) throw err;
    throw new CacheOperationError(context, err);
  }

  // 'open': treat as a cache miss.
  return fallback;
}
