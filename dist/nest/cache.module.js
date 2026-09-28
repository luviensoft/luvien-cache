var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheModule_1;
import { Module, } from '@nestjs/common';
import { CACHE } from '../core/port/cache.port.js';
import { MemoryCache } from '../adapters/memory/memory.cache.js';
import { MemcachedCache } from '../adapters/memcached/memcached.cache.js';
import { RedisCache } from '../adapters/redis/redis.cache.js';
import { CacheService } from './cache.service.js';
import { CACHE_OPTIONS } from './cache.constants.js';
let CacheModule = CacheModule_1 = class CacheModule {
    static forRoot(options) {
        return {
            module: CacheModule_1,
            global: true,
            providers: [
                { provide: CACHE_OPTIONS, useValue: options },
                ...buildProviders(),
            ],
            exports: [CACHE, CacheService],
        };
    }
    static forRootAsync(options) {
        const optionsProvider = {
            provide: CACHE_OPTIONS,
            useFactory: options.useFactory,
            inject: (options.inject ?? []),
        };
        return {
            module: CacheModule_1,
            global: true,
            imports: (options.imports ?? []),
            providers: [optionsProvider, ...buildProviders()],
            exports: [CACHE, CacheService],
        };
    }
};
CacheModule = CacheModule_1 = __decorate([
    Module({})
], CacheModule);
export { CacheModule };
function buildProviders() {
    return [
        {
            provide: CACHE,
            useFactory: (options) => {
                const namespace = options.namespace;
                const failureMode = options.failureMode ?? 'open';
                switch (options.driver.driver) {
                    case 'memory':
                        return new MemoryCache(namespace, {
                            sweepIntervalMs: options.driver.sweepIntervalMs,
                        });
                    case 'memcached':
                        return new MemcachedCache(options.driver.memcached, namespace, failureMode);
                    case 'redis':
                        return new RedisCache(options.driver.redis, namespace, failureMode);
                }
            },
            inject: [CACHE_OPTIONS],
        },
        CacheService,
    ];
}
//# sourceMappingURL=cache.module.js.map