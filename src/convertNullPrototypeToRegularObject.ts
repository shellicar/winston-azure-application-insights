/**
 * Ensures that the object returned has a constructor to avoid a {@link TypeError} from the `applicationinsights` library.
 * @param value
 * @returns
 */
export const convertNullPrototypeToRegularObject = (value: unknown): unknown => {
  if (value != null && typeof value === 'object' && value.constructor === undefined) {
    return { ...value };
  }
  return value;
};
