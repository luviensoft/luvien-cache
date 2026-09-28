import { assertValidTtl } from '../../core/domain/ttl.js';
export class MemoryCache {
    namespace;
    entries = new Map();
    sweeper = null;
    constructor(namespace, options = {}) {
        this.namespace = namespace;
        const interval = options.sweepIntervalMs ?? 60_000;
        if (interval > 0) {
            this.sweeper = setInterval(() => this.sweep(), interval);
            this.sweeper.unref?.();
        }
    }
    async get(key) {
        const entry = this.entries.get(this.physical(key));
        if (!entry)
            return null;
        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.entries.delete(this.physical(key));
            return null;
        }
        return entry.value;
    }
    async set(key, value, options) {
        assertValidTtl(options?.ttl);
        const expiresAt = options?.ttl !== undefined ? Date.now() + options.ttl * 1000 : null;
        this.entries.set(this.physical(key), { value, expiresAt });
    }
    async delete(key) {
        return this.entries.delete(this.physical(key));
    }
    async exists(key) {
        return (await this.get(key)) !== null;
    }
    async ttl(key) {
        const entry = this.entries.get(this.physical(key));
        if (!entry)
            return -2;
        if (entry.expiresAt === null)
            return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        if (remaining <= 0) {
            this.entries.delete(this.physical(key));
            return -2;
        }
        return remaining;
    }
    async expire(key, ttlSeconds) {
        assertValidTtl(ttlSeconds);
        const physical = this.physical(key);
        const entry = this.entries.get(physical);
        if (!entry)
            return false;
        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            this.entries.delete(physical);
            return false;
        }
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
        return true;
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
        if (!this.namespace) {
            this.entries.clear();
            return;
        }
        const prefix = `${this.namespace}:`;
        for (const k of this.entries.keys()) {
            if (k.startsWith(prefix))
                this.entries.delete(k);
        }
    }
    dispose() {
        if (this.sweeper) {
            clearInterval(this.sweeper);
            this.sweeper = null;
        }
    }
    physical(key) {
        if (!this.namespace)
            return key;
        return `${this.namespace}:${key}`;
    }
    sweep() {
        const now = Date.now();
        for (const [k, entry] of this.entries) {
            if (entry.expiresAt !== null && entry.expiresAt <= now) {
                this.entries.delete(k);
            }
        }
    }
}
//# sourceMappingURL=memory.cache.js.map