export interface CacheSerializer {
    serialize(value: unknown): string | Uint8Array;
    deserialize<T>(value: string | Uint8Array): T;
}
//# sourceMappingURL=cache-serializer.port.d.ts.map