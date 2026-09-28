export interface RedisCacheConfig {
    url: string;
    password?: string;
    db?: number;
    keyPrefix?: string;
    connectTimeoutMs?: number;
    maxRetriesPerRequest?: number;
    tls?: boolean;
}
//# sourceMappingURL=redis.config.d.ts.map