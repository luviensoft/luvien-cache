export type CacheFailureMode = 'open' | 'closed';

export interface CacheSetOptions {
  /**
   * Time-to-live in seconds.
   *   undefined → no expiration
   *   > 0       → expires after N seconds
   *   0         → invalid; throws
   *   < 0       → invalid; throws
   */
  ttl?: number;
}

export interface CacheRuntimeOptions {
  /**
   * Failure policy:
   *   'open'   → infrastructure errors become cache misses where safe
   *   'closed' → infrastructure errors propagate
   * Default: 'open'
   *
   * Serialization errors NEVER become cache misses regardless of policy.
   */
  failureMode?: CacheFailureMode;
  /**
   * Namespace prefix applied to every key, e.g. `my-app`.
   * Physical key = `${namespace}:${applicationKey}` when set.
   */
  namespace?: string;
}
