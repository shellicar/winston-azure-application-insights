/**
 * Test implementation of GraphQLError without referencing the GraphQL dependency.
 *
 * Allows testing how error extraction handles enumerable vs non-enumerable
 * properties. GraphQLError uses Object.defineProperties to control property
 * enumeration.
 *
 * @see https://github.com/graphql/graphql-js/blob/main/src/error/GraphQLError.ts
 */
export class GraphQLError extends Error {
  public readonly locations?: ReadonlyArray<{ line: number; column: number }>;
  public readonly path?: ReadonlyArray<string | number>;
  public readonly nodes?: ReadonlyArray<any>;
  public readonly source?: any;
  public readonly positions?: ReadonlyArray<number>;
  public readonly originalError?: Error;
  public readonly extensions: Record<string, any>;

  constructor(
    message: string,
    options: {
      extensions?: Record<string, any>;
      locations?: ReadonlyArray<{ line: number; column: number }>;
      path?: ReadonlyArray<string | number>;
    } = {},
  ) {
    super(message);
    this.name = 'GraphQLError';

    this.locations = options.locations;
    this.path = options.path;
    this.nodes = undefined;
    this.source = undefined;
    this.positions = undefined;
    this.originalError = undefined;
    this.extensions = options.extensions ?? Object.create(null);

    Object.defineProperties(this, {
      message: {
        writable: true,
        enumerable: true,
      },
      name: {
        enumerable: false,
      },
      nodes: {
        enumerable: false,
      },
      source: {
        enumerable: false,
      },
      positions: {
        enumerable: false,
      },
      originalError: {
        enumerable: false,
      },
    });
  }
}
