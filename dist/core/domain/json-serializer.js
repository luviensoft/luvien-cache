import { CacheSerializationError } from './cache-error.js';
export class JsonCacheSerializer {
    serialize(value) {
        try {
            return JSON.stringify(value);
        }
        catch (err) {
            throw new CacheSerializationError('Failed to serialize value', err);
        }
    }
    deserialize(value) {
        try {
            const str = typeof value === 'string' ? value : Buffer.from(value).toString('utf8');
            return JSON.parse(str);
        }
        catch (err) {
            throw new CacheSerializationError('Failed to deserialize value', err);
        }
    }
}
//# sourceMappingURL=json-serializer.js.map