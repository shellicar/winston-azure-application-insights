import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { extractErrorsStep } from '../src/private/extractErrorsStep';
import { isError } from '../src/private/isError';
import type { WinstonInfo } from '../src/private/types';
import type { TelemetryDataException } from '../src/public/types';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { SpyErrorTransport } from './spies/SpyErrorTransport';

describe('extractErrorsStep', () => {
  const transport = new SpyErrorTransport();
  const logger = createLogger({
    transports: [transport],
  });

  it('should extract error when info is an Error', () => {
    const expected = new Error('single error logged');
    logger.error(expected);

    const actual = transport.exceptions[0];

    expect(actual?.exception).toBe(expected);
    expect(actual?.properties).toEqual({});
  });

  it('should return empty array when no errors', () => {
    logger.error('hello world');

    const actual = transport.exceptions.length;
    const expected = 0;

    expect(actual).toBe(expected);
  });

  it('should return all errors', () => {
    logger.error('Error: 1', new Error('2'), new Error('3'));

    const actual = transport.exceptions.length;
    const expected = 2;

    expect(actual).toBe(expected);
  });

  it('does not extract first error as winston treats it as a string', () => {
    // @ts-expect-error - Argument of type 'Error' is not assignable to parameter of type 'string'.
    logger.error(new Error('first'), new Error('second'), new Error('third'));

    const actual = transport.exceptions.length;
    const expected = 2;

    expect(actual).toBe(expected);
  });

  it('should handle empty splat array', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: [],
    };

    const actual = extractErrorsStep(info, isError).length;
    const expected = 0;

    expect(actual).toBe(expected);
  });

  describe('should handle mixed types in splat', () => {
    const error1 = new Error('error1');
    const error2 = new Error('error2');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: ['string', 42, { userId: 123 }, error1, null, undefined, error2, true],
    };

    it('has two errors in splat', () => {
      const expected = 2;

      const result = extractErrorsStep(info, isError);
      const actual = result.length;

      expect(actual).toBe(expected);
    });

    it('passes first error', () => {
      const expected = error1;

      const result = extractErrorsStep(info, isError);
      const actual = result[0];

      expect(actual?.exception).toBe(expected);
      expect(actual?.properties).toEqual({});
    });

    it('passes second error', () => {
      const expected = error2;

      const result = extractErrorsStep(info, isError);
      const actual = result[1];

      expect(actual?.exception).toBe(expected);
      expect(actual?.properties).toEqual({});
    });
  });

  it('should handle null and undefined items in splat', () => {
    const expected = new Error('test');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: [null, undefined, expected, null],
    };

    const actual = extractErrorsStep(info, isError)[0];

    expect(actual?.exception).toBe(expected);
    expect(actual?.properties).toEqual({});
  });

  describe('Error property extraction', () => {
    it('should extract custom Error properties and exclude standard ones', () => {
      class CustomError extends Error {
        public readonly errorCode: string;
        public readonly metadata: Record<string, unknown>;

        constructor(message: string, errorCode: string, metadata: Record<string, unknown>) {
          super(message);
          this.name = 'CustomError';
          this.errorCode = errorCode;
          this.metadata = metadata;
        }
      }

      const customError = new CustomError('Something failed', 'E001', { userId: 123, operation: 'checkout' });

      const info: WinstonInfo = {
        level: 'error',
        message: 'Error occurred',
        [SPLAT]: [customError],
      };

      const result = extractErrorsStep(info, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(customError);
      expect(result[0]?.properties).toEqual({
        errorCode: 'E001',
        metadata: { userId: 123, operation: 'checkout' },
      });
    });

    it('should handle Object.create(null) properties on Error objects', () => {
      const extensions = Object.create(null);
      extensions.code = 'GRAPHQL_ERROR';
      extensions.field = 'userInput';

      class GraphQLError extends Error {
        public readonly extensions: Record<string, unknown>;

        constructor(message: string, extensions: Record<string, unknown>) {
          super(message);
          this.name = 'GraphQLError';
          this.extensions = extensions;
        }
      }

      const graphqlError = new GraphQLError('Validation failed', extensions);

      const info: WinstonInfo = {
        level: 'error',
        message: 'GraphQL error',
        [SPLAT]: [graphqlError],
      };

      const result = extractErrorsStep(info, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(graphqlError);
      expect(result[0]?.properties).toEqual({
        extensions,
      });
    });

    it('should exclude standard Error properties when Error is the info object', () => {
      class CustomError extends Error {
        public readonly errorCode: string;

        constructor(message: string, errorCode: string) {
          super(message);
          this.name = 'CustomError';
          this.errorCode = errorCode;
        }
      }

      const customError = new CustomError('Test error', 'E001');
      // Simulate winston adding level property to Error object
      (customError as any).level = 'error';

      const result = extractErrorsStep(customError as any, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(customError);
      expect(result[0]?.properties).toEqual({
        errorCode: 'E001',
      });
      expect(result[0]?.properties).not.toHaveProperty('level');
      expect(result[0]?.properties).not.toHaveProperty('name');
      expect(result[0]?.properties).not.toHaveProperty('message');
      expect(result[0]?.properties).not.toHaveProperty('stack');
    });

    it('should handle standard Error with no custom properties', () => {
      const standardError = new Error('Standard error');

      const info: WinstonInfo = {
        level: 'error',
        message: 'Error occurred',
        [SPLAT]: [standardError],
      };

      const result = extractErrorsStep(info, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(standardError);
      expect(result[0]?.properties).toEqual({});
    });

    it('should not extract winston properties from Error objects', () => {
      class CustomError extends Error {
        public readonly errorCode: string;

        constructor(message: string, errorCode: string) {
          super(message);
          this.name = 'CustomError';
          this.errorCode = errorCode;
        }
      }

      const customError = new CustomError('Test error', 'E001');

      const info = createWinstonInfoFromErrorOnly(customError, {
        prop1: 'hello',
        prop2: 'world',
        message: 'Hello world',
        level: 'error',
      });

      const result = extractErrorsStep(info, isError);

      const actual = result[0];
      const expected = {
        exception: customError,
        properties: {
          errorCode: 'E001',
          prop1: 'hello',
          prop2: 'world',
        },
      } satisfies TelemetryDataException;

      expect(actual).toEqual(expected);
    });

    it('should handle Error with cause property', () => {
      const rootCause = new Error('Root cause');
      const error = new Error('Wrapper error', { cause: rootCause });
      (error as any).customProp = 'test';

      const info: WinstonInfo = {
        level: 'error',
        message: 'Error occurred',
        [SPLAT]: [error],
      };

      const result = extractErrorsStep(info, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(error);
      expect(result[0]?.properties).toEqual({
        customProp: 'test',
      });
      expect(result[0]?.properties).not.toHaveProperty('cause');
    });

    it('should convert Object.create(null) properties to regular objects', () => {
      const nullProtoExtensions = Object.create(null);
      nullProtoExtensions.code = 'GRAPHQL_ERROR';
      nullProtoExtensions.field = 'userInput';

      class GraphQLError extends Error {
        public readonly extensions: Record<string, unknown>;

        constructor(message: string, extensions: Record<string, unknown>) {
          super(message);
          this.name = 'GraphQLError';
          this.extensions = extensions;
        }
      }

      const error = new GraphQLError('Test error', nullProtoExtensions);

      const info: WinstonInfo = {
        level: 'error',
        message: 'Error occurred',
        [SPLAT]: [error],
      };

      const result = extractErrorsStep(info, isError);

      expect(result).toHaveLength(1);
      expect(result[0]?.exception).toBe(error);
      expect(result[0]?.properties.extensions).toEqual({
        code: 'GRAPHQL_ERROR',
        field: 'userInput',
      });
      expect(Object.getPrototypeOf(result[0]?.properties.extensions)).toBe(Object.prototype);
    });
  });
});
