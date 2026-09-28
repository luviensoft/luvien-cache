import { describe, it, expect, beforeEach } from 'vitest';
export function describeCacheContract(name, options) {
    const { build, dispose, supportsClear = true, supportsExpire = true, supportsRemainingTtl = true, } = options;
    describe(`Cache contract: ${name}`, () => {
        let cache;
        beforeEach(async () => {
            cache = await build();
        });
        it('set + get round-trip', async () => {
            await cache.set('k', { a: 1 });
            expect(await cache.get('k')).toEqual({ a: 1 });
        });
        it('get missing returns null', async () => {
            expect(await cache.get('missing')).toBeNull();
        });
        it('overwrite replaces value', async () => {
            await cache.set('k', 'a');
            await cache.set('k', 'b');
            expect(await cache.get('k')).toBe('b');
        });
        it('delete removes key', async () => {
            await cache.set('k', 'a');
            expect(await cache.delete('k')).toBe(true);
            expect(await cache.get('k')).toBeNull();
        });
        it('delete missing returns false', async () => {
            expect(await cache.delete('missing')).toBe(false);
        });
        it('exists reflects presence', async () => {
            expect(await cache.exists('k')).toBe(false);
            await cache.set('k', 'a');
            expect(await cache.exists('k')).toBe(true);
        });
        it('ttl on missing key returns -2', async () => {
            expect(await cache.ttl('missing')).toBe(-2);
        });
        it('ttl on key without expiry returns -1', async () => {
            await cache.set('k', 'a');
            expect(await cache.ttl('k')).toBe(-1);
        });
        if (supportsRemainingTtl) {
            it('ttl after set with ttl returns positive remaining', async () => {
                await cache.set('k', 'a', { ttl: 60 });
                const t = await cache.ttl('k');
                expect(t).toBeGreaterThan(0);
                expect(t).toBeLessThanOrEqual(60);
            });
            it('ttl expires and returns -2', async () => {
                await cache.set('k', 'a', { ttl: 1 });
                await new Promise((r) => setTimeout(r, 1500));
                expect(await cache.ttl('k')).toBe(-2);
                expect(await cache.get('k')).toBeNull();
            });
        }
        it('invalid TTL 0 is rejected', async () => {
            await expect(cache.set('k', 'a', { ttl: 0 })).rejects.toThrow();
        });
        it('invalid TTL negative is rejected', async () => {
            await expect(cache.set('k', 'a', { ttl: -5 })).rejects.toThrow();
        });
        if (supportsExpire) {
            it('expire updates existing key', async () => {
                await cache.set('k', 'a');
                expect(await cache.expire('k', 30)).toBe(true);
            });
            it('expire on missing key returns false', async () => {
                expect(await cache.expire('missing', 30)).toBe(false);
            });
        }
        it('getOrSet returns cached value on hit', async () => {
            await cache.set('k', 'cached');
            let called = 0;
            const result = await cache.getOrSet('k', async () => {
                called++;
                return 'fresh';
            });
            expect(result).toBe('cached');
            expect(called).toBe(0);
        });
        it('getOrSet calls factory on miss and stores result', async () => {
            const result = await cache.getOrSet('k', async () => 'computed', {
                ttl: 60,
            });
            expect(result).toBe('computed');
            expect(await cache.get('k')).toBe('computed');
        });
        if (supportsClear) {
            it('clear removes namespaced keys only', async () => {
                await cache.set('a', 1);
                await cache.set('b', 2);
                await cache.clear();
                expect(await cache.get('a')).toBeNull();
                expect(await cache.get('b')).toBeNull();
            });
        }
    });
}
//# sourceMappingURL=cache.contract.js.map