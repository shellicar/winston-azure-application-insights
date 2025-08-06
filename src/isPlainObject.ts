export const isPlainObject = (obj: unknown): obj is Record<string, unknown> => obj != null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
