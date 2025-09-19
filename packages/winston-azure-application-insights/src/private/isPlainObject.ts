export const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
  if (obj == null || typeof obj !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
};
