// Nest
export { CacheModule } from './nest/cache.module.js';
export { CacheService } from './nest/cache.service.js';
export type {
  CacheModuleOptions,
  CacheModuleAsyncOptions,
  CacheDriverConfig,
} from './nest/cache.module.js';

// Ports and tokens
export type { Cache } from './core/port/cache.port.js';
export { CACHE } from './core/port/cache.port.js';
export type { CacheSerializer } from './core/port/cache-serializer.port.js';

// Domain
export type {
  CacheSetOptions,
  CacheFailureMode,
  CacheRuntimeOptions,
} from './core/domain/cache.types.js';
export { JsonCacheSerializer } from './core/domain/json-serializer.js';
export {
  TTL_NO_EXPIRY,
  TTL_MISSING,
  assertValidTtl,
} from './core/domain/ttl.js';

// Errors
export {
  CacheError,
  CacheConfigurationError,
  CacheConnectionError,
  CacheSerializationError,
  CacheOperationError,
} from './core/domain/cache-error.js';

// Adapters
export { MemoryCache } from './adapters/memory/memory.cache.js';
export { MemcachedCache } from './adapters/memcached/memcached.cache.js';
export type { MemcachedCacheConfig } from './adapters/memcached/memcached.config.js';
export { RedisCache } from './adapters/redis/redis.cache.js';
export type { RedisCacheConfig } from './adapters/redis/redis.config.js';

// Testing
export { describeCacheContract } from './testing/cache.contract.js';
export type { CacheContractOptions } from './testing/cache.contract.js';
