# @luvien/cache

Key-value cache infrastructure for the Luvien ecosystem.

`@luvien/cache` provides a provider-agnostic cache abstraction for NestJS applications. The same application code can use an in-memory cache, Memcached, or a Redis-compatible server such as Redis or Valkey without changing application logic.

The library is **infrastructure, not a Redis wrapper**. Application code depends on the `Cache` contract, while provider-specific clients remain inside adapters.

## Features

* Provider-agnostic `Cache` contract
* In-memory driver with lazy expiration and periodic sweep
* Memcached driver
* Redis-compatible driver for Redis and Valkey
* Normalized TTL semantics
* Cache-aside via `getOrSet`
* Namespace prefixing enforced by the library
* Namespace-scoped `clear()` that never wipes a shared backend
* Explicit failure mode: `open` or `closed`
* Normalized cache errors
* NestJS `CacheModule` with synchronous and asynchronous registration
* Reusable behavioral contract tests
* No direct `process.env` access
* No provider client exposed through the public API
* Small, stable public surface

## Architecture

```text
Application
    │
    ▼
@luvien/cache
    │
    ├── core/
    │   ├── Cache contract
    │   ├── Serializer contract
    │   ├── Domain types
    │   └── Errors
    │
    ├── adapters/
    │   ├── Memory
    │   ├── Memcached
    │   └── Redis
    │
    └── nest/
        ├── CacheModule
        └── CacheService
              │
              ▼
       Memory / Memcached / Redis / Valkey
```

Redis and Valkey are **supported backends**, not the abstraction. The abstraction is the `Cache` contract.

Dependency direction:

```text
Application
    │
    ▼
Cache contract
    │
    ▼
@luvien/cache adapters
    │
    ├── Memory
    ├── Memcached client
    └── Redis client
```

The core contracts do not depend on Redis, Memcached, NestJS, or HTTP.

## Supported drivers

| Driver      | Backend              | External infrastructure |   `clear()` | Remaining TTL |
| ----------- | -------------------- | ----------------------: | ----------: | ------------: |
| `memory`    | Process-local memory |                      No |         Yes |           Yes |
| `memcached` | Memcached            |                     Yes | No — throws |            No |
| `redis`     | Redis / Valkey       |                     Yes |         Yes |           Yes |

The `redis` driver supports both Redis and Valkey because they share the Redis wire protocol. Separate adapters are intentionally not provided.

### Driver behavior

| Capability                          |    Memory |         Memcached |             Redis |
| ----------------------------------- | --------: | ----------------: | ----------------: |
| Shared across app instances         |        No |               Yes |               Yes |
| TTL                                 |       Yes |               Yes |               Yes |
| Remaining TTL                       |       Yes |                No |               Yes |
| Namespace-scoped `clear()`          |       Yes |                No |               Yes |
| Max TTL                             | Unlimited |           30 days |         Unlimited |
| Persistence across process restarts |        No | Backend-dependent | Backend-dependent |

The persistence characteristics depend on backend configuration. `@luvien/cache` does not configure backend durability.

## Installation

```bash
bun add github:luviensoft/luvien-cache
```

`@nestjs/common`, `@nestjs/core`, and `reflect-metadata` are peer dependencies.

Provider clients such as `ioredis` and `memcached` are runtime dependencies of the package and are installed automatically.

Testing utilities are available from:

```typescript
import { describeCacheContract } from '@luvien/cache/testing';
```

## Quick start

### Register the module

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@luvien/cache';

@Module({
  imports: [
    CacheModule.forRoot({
      driver: {
        driver: 'memory',
      },
      namespace: 'my-app',
      failureMode: 'open',
    }),
  ],
})
export class AppModule {}
```

### Inject the service

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '@luvien/cache';

@Injectable()
export class UserService {
  constructor(private readonly cache: CacheService) {}

  async findById(id: string) {
    return this.cache.getOrSet(
      `user:${id}`,
      () => this.repo.findById(id),
      { ttl: 300 },
    );
  }
}
```

### Switch the backend

The application code does not change when switching drivers.

For example:

```typescript
CacheModule.forRoot({
  driver: {
    driver: 'redis',
    redis: {
      url: 'redis://localhost:6379',
    },
  },
  namespace: 'my-app',
});
```

## Configuration

```typescript
interface CacheModuleOptions {
  driver: CacheDriverConfig;
  namespace?: string;
  failureMode?: CacheFailureMode;
}

type CacheDriverConfig =
  | {
      driver: 'memory';
      sweepIntervalMs?: number;
    }
  | {
      driver: 'memcached';
      memcached: MemcachedCacheConfig;
    }
  | {
      driver: 'redis';
      redis: RedisCacheConfig;
    };

type CacheFailureMode = 'open' | 'closed';
```

### Memory

```typescript
CacheModule.forRoot({
  driver: {
    driver: 'memory',
    sweepIntervalMs: 60_000,
  },
  namespace: 'my-app',
});
```

`sweepIntervalMs` defaults to `60_000`.

Set it to `0` to disable periodic cleanup. Expired entries are still removed lazily when accessed.

### Memcached

```typescript
CacheModule.forRoot({
  driver: {
    driver: 'memcached',
    memcached: {
      servers: ['localhost:11211'],
      timeoutMs: 5000,
    },
  },
  namespace: 'my-app',
});
```

### Redis / Valkey

```typescript
CacheModule.forRoot({
  driver: {
    driver: 'redis',
    redis: {
      url: 'redis://localhost:6379',
      db: 0,
      keyPrefix: 'luvien:cache:',
      connectTimeoutMs: 5000,
      maxRetriesPerRequest: 1,
    },
  },
  namespace: 'my-app',
});
```

`keyPrefix` is the Redis client-level prefix and is separate from the cache namespace.

The physical Redis key is:

```text
{keyPrefix}{namespace}:{applicationKey}
```

Example:

```text
luvien:cache:my-app:user:42
```

### Asynchronous registration

```typescript
CacheModule.forRootAsync({
  inject: [APPLICATION_CONFIG],
  useFactory: (cfg: ApplicationConfig) => cfg.cache,
});
```

The factory must return a value compatible with `CacheModuleOptions`.

## Cache API

```typescript
interface Cache {
  get<T>(key: string): Promise<T | null>;

  set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<void>;

  delete(key: string): Promise<boolean>;

  exists(key: string): Promise<boolean>;

  ttl(key: string): Promise<number>;

  expire(key: string, ttlSeconds: number): Promise<boolean>;

  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheSetOptions,
  ): Promise<T>;

  clear(): Promise<void>;
}
```

### `get`

Returns the cached value, or `null` when the key does not exist.

```typescript
const user = await cache.get<User>('user:42');
```

### `set`

```typescript
await cache.set('user:42', user, {
  ttl: 300,
});
```

Omitting `ttl` stores the value without expiration.

### `delete`

Returns `true` when the key existed and was removed, or `false` when the key did not exist.

The operation is idempotent.

```typescript
const deleted = await cache.delete('user:42');
```

### `exists`

Returns `true` when the key exists and has not expired.

The value is not loaded.

```typescript
const exists = await cache.exists('user:42');
```

### `ttl`

Returns the remaining TTL using normalized semantics:

```text
>= 0 → remaining seconds
-1   → key exists without expiration
-2   → key does not exist
```

Memcached cannot report the remaining TTL. Its driver therefore returns:

```text
-1 → key exists
-2 → key does not exist
```

This is a documented backend limitation.

### `expire`

Sets a new TTL on an existing key.

```typescript
const updated = await cache.expire('user:42', 60);
```

Returns `true` when the key exists, otherwise `false`.

The cached value is not changed.

### `getOrSet`

`getOrSet` implements the cache-aside pattern.

```typescript
const user = await cache.getOrSet(
  `user:${id}`,
  () => userRepository.findById(id),
  { ttl: 300 },
);
```

If the key exists, the cached value is returned.

If the key does not exist, the factory is executed, its result is cached, and the result is returned.

`getOrSet` is **not a distributed lock**. Multiple processes may execute the factory simultaneously after the same cache miss.

Distributed locking is intentionally outside the scope of v0.1.

### `clear`

Removes every key belonging to the configured namespace.

It must never remove keys outside that namespace.

Driver behavior:

* **Memory** — iterates the local map and removes matching keys.
* **Redis** — uses `SCAN` with the namespace pattern and deletes matching keys. It never calls `FLUSHDB`.
* **Memcached** — throws because Memcached does not provide safe key enumeration. `flush_all` would affect the entire instance and is therefore never used.

## TTL semantics

TTL is expressed in seconds.

| Value       | Behavior                                |
| ----------- | --------------------------------------- |
| `undefined` | No expiration                           |
| `> 0`       | Expires after N seconds                 |
| `0`         | Rejected with `CacheConfigurationError` |
| `< 0`       | Rejected with `CacheConfigurationError` |

`0` is intentionally rejected because Redis and Memcached interpret zero-expiration semantics differently.

Use `undefined` for a value without expiration.

## Serialization

Values are serialized using JSON by default through `JsonCacheSerializer`.

Non-serializable values throw `CacheSerializationError`.

Serialization errors always propagate, regardless of `failureMode`.

A custom serializer is not injectable in v0.1. A future version may expose:

```typescript
serializer?: CacheSerializer;
```

This is intentionally not part of the current API until a concrete use case requires it.

## Namespace

The cache namespace is owned by the infrastructure layer.

The application writes:

```typescript
await cache.set('user:42', user);
```

With:

```typescript
namespace: 'my-app'
```

the backend receives:

```text
my-app:user:42
```

For Redis with:

```text
keyPrefix = luvien:cache:
```

the physical key becomes:

```text
luvien:cache:my-app:user:42
```

The application must not include the namespace itself.

This prevents accidental namespace duplication and allows `clear()` to operate safely within the configured namespace.

## Failure mode

`failureMode` controls how infrastructure failures are exposed to the application.

### `open`

Default behavior.

Cache infrastructure errors are treated as cache misses where doing so is safe. The application can continue to its source of truth.

```typescript
const user = await cache.get<User>('user:42');
// null when the cache backend is unavailable
```

This mode is appropriate when the cache is a performance optimization.

### `closed`

Infrastructure errors propagate to the caller.

```typescript
try {
  await cache.get<User>('user:42');
} catch (err) {
  // CacheError
}
```

This mode is appropriate when cache availability is part of the correctness path, such as infrastructure built on top of cache-backed coordination.

Serialization errors are never converted into cache misses.

A serialization failure indicates an application or configuration problem rather than a transient backend failure.

## Errors

```text
CacheError
├── CacheConfigurationError
├── CacheConnectionError
├── CacheSerializationError
└── CacheOperationError
```

Provider-specific errors are translated into the normalized error hierarchy.

Provider client errors never leak through the public API.

The original error is preserved as `cause` for diagnostics.

Example HTTP mapping:

```typescript
@Catch(CacheError)
export class CacheErrorFilter implements ExceptionFilter {
  catch(err: CacheError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let code = 'CACHE_ERROR';

    if (err instanceof CacheConnectionError) {
      status = 503;
      code = 'CACHE_UNAVAILABLE';
    } else if (err instanceof CacheSerializationError) {
      code = 'CACHE_SERIALIZATION_ERROR';
    } else if (err instanceof CacheConfigurationError) {
      code = 'CACHE_CONFIGURATION_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      error: code,
      message: err.message,
    });
  }
}
```

Register the filter once with `APP_FILTER`.

Never expose `err.cause` to clients.

HTTP error mapping belongs to the application layer; the example above is not part of `@luvien/cache`.

## Testing

Every driver is tested against the same behavioral contract.

```typescript
import { describeCacheContract } from '@luvien/cache/testing';
import { MyCustomCache } from './my-custom.cache.js';

describeCacheContract('MyCustomCache', {
  build: () => new MyCustomCache(),
  supportsClear: true,
  supportsExpire: true,
  supportsRemainingTtl: true,
});
```

The contract covers:

* `set` / `get`
* missing keys
* overwrite
* `delete`
* `exists`
* TTL
* expiration
* invalid TTL
* `expire`
* `getOrSet`
* `clear`

Integration tests against real Redis, Memcached, and Valkey can use Docker Compose:

```bash
docker compose -f examples/cache/compose.yaml up -d
```

```bash
TEST_REDIS_URL=redis://localhost:6379 \
TEST_MEMCACHED_SERVERS=localhost:11211 \
pnpm --filter @luvien/cache test
```

The normal unit test suite uses `MemoryCache` and requires no external infrastructure.

## Scope

`@luvien/cache` intentionally does not provide:

* Redis data structures such as `HSET`, `LPUSH`, `XADD`, or `EVAL`
* Distributed locking
* Pub/Sub
* Redis Streams or consumer groups
* Job queues
* Rate-limiting primitives
* Session management
* Automatic cache invalidation from entity events
* Automatic tenant scope
* Cache decorators such as `@Cacheable` or `@CacheEvict`

These concerns belong to the application or to separate infrastructure packages.

`@luvien/cache` is a **key-value cache abstraction, not a Redis wrapper**.

## Boundary

```text
Application
    │
    ├── cache keys
    ├── key design
    ├── invalidation policy
    └── business semantics
    │
    ▼
@luvien/cache
    │
    ├── cache contract
    ├── namespace isolation
    ├── TTL semantics
    ├── failure policy
    ├── serialization
    └── provider adaptation
    │
    ▼
Backend
    │
    ├── eviction
    ├── memory limits
    ├── availability
    └── backend-specific persistence
```

Do not use `@luvien/cache` as a distributed lock, queue, session store, or general-purpose Redis client.

### Tenant-specific keys

Tenant isolation is an application responsibility.

If the application requires tenant-specific caching, the application defines the key:

```typescript
await cache.set(
  `tenant:${tenantId}:user:${userId}`,
  user,
);
```

The cache library does not automatically inject tenant context or use `AsyncLocalStorage`.

## Choosing a driver

### Memory

Use `memory` for:

* local development
* unit tests
* single-process applications
* temporary process-local caching

Data is lost when the process restarts and is not shared between application instances.

### Memcached

Use `memcached` when:

* a shared distributed cache is required
* simple key-value caching is sufficient
* namespace-scoped `clear()` is not required
* remaining TTL is not required

### Redis / Valkey

Use `redis` when:

* the cache is shared between application instances
* remaining TTL is required
* namespace-scoped `clear()` is required
* Redis-compatible infrastructure is already available

The same `redis` driver supports both Redis and Valkey.

## Verification

The current implementation has been manually verified with the `memory` driver for:

| Behavior                        | Result |
| ------------------------------- | ------ |
| `set` + `get`                   | Passed |
| `ttl` on existing key           | Passed |
| `ttl` on missing key            | Passed |
| `expire`                        | Passed |
| Expiration                      | Passed |
| `exists` after expiration       | Passed |
| Idempotent `delete`             | Passed |
| `getOrSet` cache-aside behavior | Passed |
| Invalid TTL rejection           | Passed |
| Namespace-scoped `clear()`      | Passed |
| Namespace prefixing             | Passed |

Redis and Memcached verification should be performed separately against their real backends.

## Status

🚧 **Work in progress**

The API may change before the first stable release.

## License

PolyForm Shield 1.0.0
