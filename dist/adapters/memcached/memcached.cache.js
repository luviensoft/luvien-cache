import Memcached from 'memcached';
import { assertValidTtl, TTL_MISSING, TTL_NO_EXPIRY, } from '../../core/domain/ttl.js';
import { handleInfraError } from '../../core/domain/failure.js';
const MEMCACHED_MAX_TTL = 30 * 24 * 60 * 60;
export class MemcachedCache {
    client;
    namespace;
    failureMode;
    prefix;
    constructor(config, namespace, failureMode = 'open') {
        this.namespace = namespace;
        this.failureMode = failureMode;
        this.prefix = config.keyPrefix ?? 'luvien:cache:';
        this.client = new Memcached(config.servers, {
            timeout: config.timeoutMs ?? 5000,
        });
    }
    async get(key) {
        try {
            const raw = await this.call('get', this.physical(key));
            if (raw === undefined || raw === null)
                return null;
            return raw;
        }
        catch (err) {
            return handleInfraError(err, this.failureMode, `Failed to get: ${key}`, null);
        }
    }
    async set(key, value, options) {
        assertValidTtl(options?.ttl);
        const ttl = options?.ttl ?? 0;
        if (ttl > MEMCACHED_MAX_TTL) {
            throw new Error(`TTL ${ttl}s exceeds Memcached max of ${MEMCACHED_MAX_TTL}s`);
        }
        try {
            await this.call('set', this.physical(key), value, ttl);
        }
        catch (err) {
            handleInfraError(err, this.failureMode, `Failed to set: ${key}`, undefined);
        }
    }
    async delete(key) {
        try {
            await this.call('delete', this.physical(key));
            return true;
        }
        catch (err) {
            if (err?.message?.includes('NOT_FOUND'))
                return false;
            return handleInfraError(err, this.failureMode, `Failed to delete: ${key}`, false);
        }
    }
    async exists(key) {
        const v = await this.get(key);
        return v !== null;
    }
    async ttl(key) {
        const present = await this.exists(key);
        return present ? TTL_NO_EXPIRY : TTL_MISSING;
    }
    async expire(key, ttlSeconds) {
        assertValidTtl(ttlSeconds);
        try {
            const value = await this.call('get', this.physical(key));
            if (value === undefined)
                return false;
            await this.call('set', this.physical(key), value, ttlSeconds);
            return true;
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
        throw new Error('MemcachedCache.clear() is not supported. Memcached has no namespaced bulk delete. ' +
            'Use a namespace-aware eviction strategy in the application.');
    }
    async dispose() {
        this.client.end();
    }
    physical(key) {
        if (!this.namespace)
            return `${this.prefix}${key}`;
        return `${this.prefix}${this.namespace}:${key}`;
    }
    call(method, ...args) {
        return new Promise((resolve, reject) => {
            const fn = this.client[method];
            if (typeof fn !== 'function') {
                reject(new Error(`Unknown Memcached method: ${method}`));
                return;
            }
            fn.call(this.client, ...args, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
}
//# sourceMappingURL=memcached.cache.js.map