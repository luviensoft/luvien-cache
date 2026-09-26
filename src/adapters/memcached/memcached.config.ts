export interface MemcachedCacheConfig {
  servers: string[];
  /** Connection timeout in ms. Default 5000. */
  timeoutMs?: number;
  /** Key namespace prefix inside Memcached. */
  keyPrefix?: string;
}
