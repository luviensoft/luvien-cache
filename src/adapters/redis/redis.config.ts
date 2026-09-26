export interface RedisCacheConfig {
  /** Redis connection URL, e.g. redis://localhost:6379 or rediss://... */
  url: string;
  /** Optional password (already in URL if you prefer). */
  password?: string;
  /** Optional db index. */
  db?: number;
  /** Key prefix inside Redis. Defaults to 'luvien:cache:'. */
  keyPrefix?: string;
  /** Connect timeout in ms. */
  connectTimeoutMs?: number;
  /** Max retries per request. Default 1 (fail fast). */
  maxRetriesPerRequest?: number;
  /** Enable TLS (auto-detected for rediss://). */
  tls?: boolean;
}
