import { describe, it, afterEach } from 'vitest';
import { MemoryCache } from './memory.cache.js';
import { describeCacheContract } from '../../testing/cache.contract.js';

const instances: MemoryCache[] = [];

afterEach(() => {
  for (const m of instances) m.dispose();
  instances.length = 0;
});

describeCacheContract('MemoryCache', {
  build: () => {
    const m = new MemoryCache(undefined, { sweepIntervalMs: 0 });
    instances.push(m);
    return m;
  },
  supportsClear: true,
  supportsExpire: true,
  supportsRemainingTtl: true,
});

describe('MemoryCache namespace', () => {
  it('scopes clear() to namespace', async () => {
    const a = new MemoryCache('app-a', { sweepIntervalMs: 0 });
    const b = new MemoryCache('app-b', { sweepIntervalMs: 0 });
    instances.push(a, b);

    await a.set('shared', 1);
    await b.set('shared', 2);
    await a.clear();

    // Note: MemoryCache instances have separate Maps in this test,
    // so this only verifies internal isolation.
    expect(await a.get('shared')).toBeNull();
    expect(await b.get('shared')).toBe(2);
  });
});
