import { describe, it, expect } from 'vitest';
import { assertValidTtl } from './ttl.js';
import { CacheConfigurationError } from './cache-error.js';

describe('assertValidTtl', () => {
  it('accepts undefined', () => {
    expect(() => assertValidTtl(undefined)).not.toThrow();
  });

  it('accepts positive integers', () => {
    expect(() => assertValidTtl(60)).not.toThrow();
  });

  it('rejects 0', () => {
    expect(() => assertValidTtl(0)).toThrow(CacheConfigurationError);
  });

  it('rejects negative', () => {
    expect(() => assertValidTtl(-1)).toThrow(CacheConfigurationError);
  });

  it('rejects NaN', () => {
    expect(() => assertValidTtl(NaN)).toThrow(CacheConfigurationError);
  });

  it('rejects Infinity', () => {
    expect(() => assertValidTtl(Infinity)).toThrow(CacheConfigurationError);
  });
});
