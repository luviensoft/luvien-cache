var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { CACHE } from '../core/port/cache.port.js';
let CacheService = class CacheService {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, options) {
        return this.cache.set(key, value, options);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    exists(key) {
        return this.cache.exists(key);
    }
    ttl(key) {
        return this.cache.ttl(key);
    }
    expire(key, ttlSeconds) {
        return this.cache.expire(key, ttlSeconds);
    }
    getOrSet(key, factory, options) {
        return this.cache.getOrSet(key, factory, options);
    }
    clear() {
        return this.cache.clear();
    }
    async onApplicationShutdown() {
        const maybeDisposable = this.cache;
        if (typeof maybeDisposable.dispose === 'function') {
            await maybeDisposable.dispose();
        }
    }
};
CacheService = __decorate([
    Injectable(),
    __param(0, Inject(CACHE)),
    __metadata("design:paramtypes", [Object])
], CacheService);
export { CacheService };
//# sourceMappingURL=cache.service.js.map