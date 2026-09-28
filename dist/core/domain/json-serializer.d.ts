import type { CacheSerializer } from '../port/cache-serializer.port.js';
export declare class JsonCacheSerializer implements CacheSerializer {
    serialize(value: unknown): string;
    deserialize<T>(value: string | Uint8Array): T;
}
//# sourceMappingURL=json-serializer.d.ts.map