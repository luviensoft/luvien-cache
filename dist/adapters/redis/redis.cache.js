import { Redis } from 'ioredis';
import { assertValidTtl, TTL_MISSING, TTL_NO_EXPIRY, } from '../../core/domain/ttl.js';
import { handleInfraError } from '../../core/domain/failure.js';
export class RedisCache {
    client;
    namespace;
    failureMode;
    prefix;
    constructor(config, namespace, failureMode = 'open') {
        this.namespace = namespace;
        this.failureMode = failureMode;
        this.prefix = config.keyPrefix ?? 'luvien:cache:';
        this.client = new Redis(config.url, {
            password: config.password,
            db: config.db,
            keyPrefix: this.prefix,
            connectTimeout: config.connectTimeoutMs ?? 5000,
            maxRetriesPerRequest: config.maxRetriesPerRequest ?? 1,
            lazyConnect: false,
            enableReadyCheck: true,
        });
        this.client.on('error', () => {
        });
    }
    async get(key) {
        try {
            const raw = await this.client.get(this.physical(key));
            if (raw === null)
                return null;
            return JSON.parse(raw);
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to get: ${key}`, null);
        }
    }
    async set(key, value, options) {
        assertValidTtl(options?.ttl);
        const payload = JSON.stringify(value);
        try {
            if (options?.ttl !== undefined) {
                await this.client.set(this.physical(key), payload, 'EX', options.ttl);
            }
            else {
                await this.client.set(this.physical(key), payload);
            }
        }
        catch (err) {
            handleInfraError(err, this.failureMode, `Failed to set: ${key}`, undefined);
        }
    }
    async delete(key) {
        try {
            const n = await this.client.del(this.physical(key));
            return n > 0;
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to delete: ${key}`, false);
        }
    }
    async exists(key) {
        try {
            const n = await this.client.exists(this.physical(key));
            return n > 0;
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to check existence: ${key}`, false);
        }
    }
    async ttl(key) {
        try {
            const t = await this.client.ttl(this.physical(key));
            if (t === -2)
                return TTL_MISSING;
            if (t === -1)
                return TTL_NO_EXPIRY;
            return t;
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to read TTL: ${key}`, TTL_MISSING);
        }
    }
    async expire(key, ttlSeconds) {
        assertValidTtl(ttlSeconds);
        try {
            const n = await this.client.expire(this.physical(key), ttlSeconds);
            return n === 1;
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to set expiry: ${key}`, false);
        }
    }
    async getOrSet(key, factory, options) {
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const value = await factory();
        await this.set(key, value, options);
        return value;
    }
    async clear() {
        const pattern = this.namespace
            ? `${this.prefix}${this.namespace}:*`
            : `${this.prefix}*`;
        let cursor = '0';
        do {
            try {
                const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = next;
                if (keys.length > 0) {
                    const bare = keys.map((k) => k.startsWith(this.prefix) ? k.slice(this.prefix.length) : k);
                    await this.client.del(...bare);
                }
            }
            catch (err) {
                handleInfraError(err, this.failureMode, 'Failed to clear namespaced keys', undefined);
                return;
            }
        } while (cursor !== '0');
    }
    async dispose() {
        await this.client.quit().catch(() => undefined);
    }
    physical(key) {
        if (!this.namespace)
            return key;
        return `${this.namespace}:${key}`;
    }
}
//# sourceMappingURL=redis.cache.js.map