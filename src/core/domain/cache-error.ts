export class CacheError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class CacheConfigurationError extends CacheError {}
export class CacheConnectionError extends CacheError {}
export class CacheSerializationError extends CacheError {}
export class CacheOperationError extends CacheError {}
