import { describe, it, expect, afterEach } from 'vitest';
import { MemcachedCache } from './memcached.cache.js';
import { describeCacheContract } from '../../testing/cache.contract.js';

const MEMCACHED_SERVERS = process.env.TEST_MEMCACHED_SERVERS;

describe.skipIf(!MEMCACHED_SERVERS)('MemcachedCache integration', () => {
  const instances: MemcachedCache[] = [];

  afterEach(async () => {
    for (const m of instances) await m.dispose();
    instances.length = 0;
  });

  describeCacheContract('MemcachedCache', {
    build: () => {
      const m = new MemcachedCache(
        { servers: MEMCACHED_SERVERS!.split(',') },
        `contract-${Date.now()}`,
      );
      instances.push(m);
      return m;
    },
    supportsClear: false,
    supportsExpire: true,
    supportsRemainingTtl: false,
  });

  it('clear() throws explicitly', async () => {
    const m = new MemcachedCache(
      { servers: MEMCACHED_SERVERS!.split(',') },
      'ns',
    );
    instances.push(m);
    await expect(m.clear()).rejects.toThrow();
  });
});
