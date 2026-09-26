import { CacheSerializationError } from './cache-error.js';
import type { CacheSerializer } from '../port/cache-serializer.port.js';

export class JsonCacheSerializer implements CacheSerializer {
  serialize(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch (err) {
      throw new CacheSerializationError('Failed to serialize value', err);
    }
  }

  deserialize<T>(value: string | Uint8Array): T {
    try {
      const str =
        typeof value === 'string' ? value : Buffer.from(value).toString('utf8');
      return JSON.parse(str) as T;
    } catch (err) {
      throw new CacheSerializationError('Failed to deserialize value', err);
    }
  }
}
