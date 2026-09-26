import { describe, it, expect, afterEach } from 'vitest';
import { RedisCache } from './redis.cache.js';
import { describeCacheContract } from '../../testing/cache.contract.js';

const REDIS_URL = process.env.TEST_REDIS_URL;

describe.skipIf(!REDIS_URL)('RedisCache integration', () => {
  const instances: RedisCache[] = [];

  afterEach(async () => {
    for (const r of instances) await r.dispose();
    instances.length = 0;
  });

  describeCacheContract('RedisCache', {
    build: async () => {
      const r = new RedisCache(
        { url: REDIS_URL!, keyPrefix: 'luvien-test:' },
        'contract',
      );
      instances.push(r);
      await r.set('__warmup', 1);
      await r.delete('__warmup');
      return r;
    },
    supportsClear: true,
    supportsExpire: true,
    supportsRemainingTtl: true,
  });

  it('scopes clear() to namespace', async () => {
    const a = new RedisCache({ url: REDIS_URL! }, 'app-a');
    const b = new RedisCache({ url: REDIS_URL! }, 'app-b');
    instances.push(a, b);

    await a.set('shared', 1);
    await b.set('shared', 2);
    await a.clear();

    expect(await a.get('shared')).toBeNull();
    expect(await b.get('shared')).toBe(2);
  });
});
