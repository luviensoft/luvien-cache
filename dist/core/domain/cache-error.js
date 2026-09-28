export class CacheError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = new.target.name;
        Error.captureStackTrace?.(this, new.target);
    }
}
export class CacheConfigurationError extends CacheError {
}
export class CacheConnectionError extends CacheError {
}
export class CacheSerializationError extends CacheError {
}
export class CacheOperationError extends CacheError {
}
//# sourceMappingURL=cache-error.js.map