import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { extractPropertiesStep } from '../src/private/extractPropertiesStep';
import type { WinstonInfo } from '../src/private/types';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { GraphQLError } from './GraphQLError';

describe('Refactored AzureApplicationInsightsLogger', () => {
  describe('extractPropertiesStep', () => {
    it('should extract properties from info object', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test message',
        userId: 123,
        appVersion: '1.0.0',
      };

      const actual = extractPropertiesStep(info);
      const expected = { userId: 123, appVersion: '1.0.0' };

      expect(actual).toEqual(expected);
    });

    it('should extract single property object directly', () => {
      const expected = { userId: 123, action: 'login' };

      const info: WinstonInfo = {
        level: 'info',
        message: 'User logged in',
        [SPLAT]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should return empty object when no properties', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'simple message',
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    describe('with multiple property objects', () => {
      const properties1 = { userId: 123 };
      const properties2 = { sessionId: 'abc' };
      const error = new Error('test');

      const info: WinstonInfo = {
        level: 'info',
        message: 'mixed data',
        [SPLAT]: ['string', 42, properties1, error, null, properties2, true],
      };

      it('should return empty object when first splat item is primitive, ignoring later objects', () => {
        const result = extractPropertiesStep(info);
        const expected = {};
        expect(result).toEqual(expected);
      });
    });

    it('should handle object with message property directly when single', () => {
      const expected = { message: 'world', userId: 123 };

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [SPLAT]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should extract single property object even with multiple errors', () => {
      const expected = { key1: 'hello', key2: 'world' };
      const error1 = new Error('error1');
      const error2 = new Error('error2');

      const info: WinstonInfo = {
        level: 'error',
        message: 'oh noes',
        [SPLAT]: [error1, error2, expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should return empty object when splat contains only errors', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: 'error occurred',
        [SPLAT]: [new Error('test error')],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });
  });

  describe('Object Type Discrimination Tests', () => {
    it('should extract plain object directly', () => {
      const expected = { userId: 123, action: 'login' };
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should ignore array as single item', () => {
      const arrayObject = [1, 2, 3];
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [arrayObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should handle Date as single item', () => {
      const dateObject = new Date('2025-01-01');
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [dateObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should handle custom class as single item', () => {
      class CustomClass {
        prop = 'value';
        method() {
          return 'test';
        }
      }
      const customObject = new CustomClass();

      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [customObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should handle string as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: ['hello'],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should handle number as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [42],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should handle boolean as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [SPLAT]: [true],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('handles null prototype objects', () => {
      class MyError extends Error {
        public extensions: Record<string, any>;
        constructor(
          message: string,
          public readonly options: Record<string, any>,
        ) {
          super(message);
          this.extensions = options.extensions;
        }
      }

      const err = new MyError('test', {
        extensions: Object.create(null),
      });

      const info: WinstonInfo = {
        level: 'error',
        message: 'hello world test',
        extensions: err.extensions,
        options: err.options,
        [SPLAT]: [err],
      };

      const actual = extractPropertiesStep(info);
      const expected = {
        extensions: {},
        options: {
          extensions: {},
        },
      };

      expect(actual).toEqual(expected);
      expect((actual.extensions as any).constructor).toBeDefined();
    });

    it('should extract Object.create(null) properties', () => {
      const nullProtoObject = Object.create(null);
      nullProtoObject.errorCode = 'APOLLO_ERROR';
      nullProtoObject.extensions = { code: 'GRAPHQL_ERROR' };

      const info: WinstonInfo = {
        level: 'error',
        message: 'Apollo error',
        [SPLAT]: [nullProtoObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {
        errorCode: 'APOLLO_ERROR',
        extensions: { code: 'GRAPHQL_ERROR' },
      };

      expect(actual).toEqual(expected);
    });

    it('should extract properties from regular objects containing Object.create(null) property values', () => {
      const nullProtoExtensions = Object.create(null);
      nullProtoExtensions.code = 'GRAPHQL_VALIDATION_FAILED';
      nullProtoExtensions.field = 'userInput';

      const errorObject = {
        errorCode: 'APOLLO_ERROR',
        extensions: nullProtoExtensions,
        severity: 'high',
      };

      const info: WinstonInfo = {
        level: 'error',
        message: 'Apollo validation error',
        [SPLAT]: [errorObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {
        errorCode: 'APOLLO_ERROR',
        extensions: nullProtoExtensions,
        severity: 'high',
      };

      expect(actual).toEqual(expected);
    });

    it('should extract properties from Error objects with Object.create(null) extensions', () => {
      const error = new GraphQLError('GraphQL validation failed', {
        extensions: Object.create(null),
      });

      const info: WinstonInfo = {
        level: 'error',
        message: 'Apollo error',
        [SPLAT]: [error],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should extract properties from Error objects with populated Object.create(null) extensions', () => {
      const extensions = Object.create(null);
      extensions.code = 'GRAPHQL_VALIDATION_FAILED';
      extensions.field = 'userInput';
      extensions.locations = [{ line: 1, column: 5 }];
      extensions.errorCode = 'APOLLO_ERROR';

      const error = new GraphQLError('GraphQL validation failed', {
        extensions,
      });

      const info: WinstonInfo = {
        level: 'error',
        message: 'Apollo error',
        [SPLAT]: [error],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should extract properties from Error object when Error is the info object', () => {
      class CustomError extends Error {
        public readonly errorCode: string;
        public readonly userId: number;

        constructor(message: string, errorCode: string, userId: number) {
          super(message);
          this.errorCode = errorCode;
          this.userId = userId;
        }
      }

      const error = new CustomError('Database connection failed', 'DB_CONN_ERR', 123);
      const info = createWinstonInfoFromErrorOnly(error, {
        level: 'error',
      });

      const actual = extractPropertiesStep(info);
      const expected = {
        errorCode: 'DB_CONN_ERR',
        userId: 123,
      };

      expect(actual).toEqual(expected);
    });
  });
});
