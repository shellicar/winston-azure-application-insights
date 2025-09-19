import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger, format } from 'winston';
import type { WinstonInfo } from '../src/private/types';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { createWinstonInfo } from './createWinstonInfoWithErrorInSplat';
import { expectInfo } from './expectInfoEntries';
import { GraphQLError } from './GraphQLError';
import { SpyConsoleTransport } from './spies/SpyConsoleTransport';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

// biome-ignore lint/complexity/noBannedTypes: this is intended
const extractEnumerableProperties = (arg: {}) => {
  return Object.fromEntries(Object.entries(arg));
};

class CustomClass {
  constructor(public prop: string) {}
}
class CustomClassA {
  constructor(public propA: string) {}
}
class CustomClassB {
  constructor(public propB: string) {}
}

describe('Winston behaviour verification', () => {
  describe('Raw Winston Behaviour', () => {
    const captureTransport = new SpyWinstonTransport();

    describe('Splat Processing Logic', () => {
      describe('basic splat vs defaultMeta conflicts', () => {
        it('merges splat properties with defaultMeta, splat taking precedence over conflicts', () => {
          const logger = createLogger({
            defaultMeta: { appVersion: '1.2.3', userId: 123 },
            format: format.json(),
            transports: [captureTransport],
          });

          logger.info('hello', { appVersion: '2.3.4', sessionId: 'abc' });
          const actual = captureTransport.capturedWinstonInfo[0];

          const expected = {
            appVersion: '2.3.4',
            userId: 123,
            sessionId: 'abc',
            level: 'info',
            message: 'hello',
            [SPLAT]: [{ appVersion: '2.3.4', sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });
      });

      describe('multiple splat items (first object wins)', () => {
        it('merges only first splat object properties, ignoring subsequent objects', () => {
          const logger = createLogger({
            defaultMeta: { appVersion: '1.2.3', userId: 123 },
            format: format.json(),
            transports: [captureTransport],
          });

          logger.info('hello', { sessionId: 'abc' }, { requestId: 'req-123' }, 'extra-data');
          const actual = captureTransport.capturedWinstonInfo[0];

          const expected = {
            appVersion: '1.2.3',
            userId: 123,
            sessionId: 'abc',
            level: 'info',
            message: 'hello',
            [SPLAT]: [{ sessionId: 'abc' }, { requestId: 'req-123' }, 'extra-data'],
          };
          expectInfo(actual, expected);
        });
      });

      describe('primitive first splat parameters', () => {
        it('ignores number primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', 42, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [42, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores string primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', 'hello', { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: ['hello', { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores boolean primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', true, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [true, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores null primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', null, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [null, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores Date objects', () => {
          const testDate = new Date('2025-01-01T00:00:00Z');
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', testDate, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [testDate, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('extracts array elements as enumerable properties', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          logger.info('test', [1, 2, 3], { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            '0': 1,
            '1': 2,
            '2': 3,
            [SPLAT]: [[1, 2, 3], { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores function primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          const testFunction = () => 'test';
          logger.info('test', testFunction, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [testFunction, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('ignores bigint primitives', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });
          const testBigInt = 123n;
          logger.info('test', testBigInt, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'info',
            message: 'test',
            [SPLAT]: [testBigInt, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });
      });

      describe('custom class property extraction', () => {
        it('extracts custom class properties and merges with defaultMeta', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const customObject = new CustomClass('value');
          logger.info('test message', customObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            prop: 'value',
            level: 'info',
            message: 'test message',
            [SPLAT]: [new CustomClass('value')],
          };
          expectInfo(actual, expected);
        });

        it('extracts custom class properties when no defaultMeta is present', () => {
          const logger = createLogger({
            transports: [captureTransport],
          });

          const customObject = new CustomClass('value');
          logger.info('test message', customObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            prop: 'value',
            level: 'info',
            message: 'test message',
            [SPLAT]: [new CustomClass('value')],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from first custom class only, ignoring subsequent classes with same property names', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const customObject1 = new CustomClass('value1');
          const customObject2 = new CustomClass('value2');
          logger.info('test message', customObject1, customObject2);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            prop: 'value1',
            level: 'info',
            message: 'test message',
            [SPLAT]: [customObject1, customObject2],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from first custom class only, ignoring different property names from subsequent classes', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const customObjectA = new CustomClassA('valueA');
          const customObjectB = new CustomClassB('valueB');
          logger.info('test message', customObjectA, customObjectB);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            propA: 'valueA',
            level: 'info',
            message: 'test message',
            [SPLAT]: [customObjectA, customObjectB],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from first custom class only, ignoring subsequent non-object splat parameters', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const customObject = new CustomClass('value');
          logger.info('test message', customObject, 'extra-string', 42, { sessionId: 'abc' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            prop: 'value',
            level: 'info',
            message: 'test message',
            [SPLAT]: [customObject, 'extra-string', 42, { sessionId: 'abc' }],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from first object and preserves Error in SPLAT, ignoring subsequent objects', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Test error message');
          logger.error('hello', { my: 'object' }, testError);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            my: 'object',
            level: 'error',
            message: 'hello',
            [SPLAT]: [{ my: 'object' }, testError],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from first object only, preserving Error and subsequent items in SPLAT', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Test error message');
          logger.error('hello', { my: 'object' }, testError, { another: 'object' }, 'extra');
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            my: 'object',
            level: 'error',
            message: 'hello',
            [SPLAT]: [{ my: 'object' }, testError, { another: 'object' }, 'extra'],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from Object.create(null) objects', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const nullProtoObject = Object.create(null);
          nullProtoObject.errorCode = 'APOLLO_ERROR';
          nullProtoObject.message = 'GraphQL error';

          logger.error('Apollo error', nullProtoObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            message: 'Apollo error GraphQL error',
            level: 'error',
            [SPLAT]: [nullProtoObject],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from objects containing Object.create(null) property values', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const nullProtoExtensions = Object.create(null);
          nullProtoExtensions.code = 'GRAPHQL_VALIDATION_FAILED';
          nullProtoExtensions.field = 'userInput';

          const errorObject = {
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
          };

          logger.error('Apollo validation error', errorObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
            level: 'error',
            message: 'Apollo validation error',
            [SPLAT]: [errorObject],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from Error objects with Object.create(null) extensions', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const error = new GraphQLError('GraphQL validation failed', {
            extensions: Object.create(null),
          });

          logger.error('Apollo error', error);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            extensions: error.extensions,
            locations: error.locations,
            path: error.path,
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            stack: error.stack,
            [SPLAT]: [error],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from Error objects with populated Object.create(null) extensions', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const extensions = Object.create(null);
          extensions.code = 'GRAPHQL_VALIDATION_FAILED';
          extensions.field = 'userInput';
          extensions.locations = [{ line: 1, column: 5 }];
          extensions.errorCode = 'APOLLO_ERROR';

          const error = new GraphQLError('GraphQL validation failed', {
            extensions,
          });

          logger.error('Apollo error', error);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            extensions: extensions,
            locations: error.locations,
            path: error.path,
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            stack: error.stack,
            [SPLAT]: [error],
          };
          expectInfo(actual, expected);
        });
      });

      describe('Object.create(null) property extraction scenarios', () => {
        it('extracts properties from Object.create(null) objects as first splat', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const nullProtoObject = Object.create(null);
          nullProtoObject.errorCode = 'APOLLO_ERROR';
          nullProtoObject.message = 'GraphQL error';

          logger.error('Apollo error', nullProtoObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            message: 'Apollo error GraphQL error',
            level: 'error',
            [SPLAT]: [nullProtoObject],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from regular objects containing Object.create(null) property values', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const nullProtoExtensions = Object.create(null);
          nullProtoExtensions.code = 'GRAPHQL_VALIDATION_FAILED';
          nullProtoExtensions.field = 'userInput';

          const errorObject = {
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
          };

          logger.error('Apollo validation error', errorObject);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
            level: 'error',
            message: 'Apollo validation error',
            [SPLAT]: [errorObject],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from Error objects with Object.create(null) extensions', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const error = new GraphQLError('GraphQL validation failed', {
            extensions: Object.create(null),
          });

          logger.error('Apollo error', error);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            extensions: error.extensions,
            locations: error.locations,
            path: error.path,
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            stack: error.stack,
            [SPLAT]: [error],
          };
          expectInfo(actual, expected);
        });

        it('extracts properties from Error objects with populated Object.create(null) extensions', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const extensions = Object.create(null);
          extensions.code = 'GRAPHQL_VALIDATION_FAILED';
          extensions.field = 'userInput';
          extensions.locations = [{ line: 1, column: 5 }];
          extensions.errorCode = 'APOLLO_ERROR';

          const error = new GraphQLError('GraphQL validation failed', {
            extensions,
          });

          logger.error('Apollo error', error);
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            extensions: extensions,
            locations: error.locations,
            path: error.path,
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            stack: error.stack,
            [SPLAT]: [error],
          };
          expectInfo(actual, expected);
        });
      });

      describe('no splat scenarios', () => {
        it('should preserve defaultMeta properties and not create SPLAT when no additional parameters provided', () => {
          const logger = createLogger({
            defaultMeta: { appVersion: '1.2.3', userId: 123 },
            format: format.json(),
            transports: [captureTransport],
          });

          logger.info('hello world');
          const actual = captureTransport.capturedWinstonInfo[0];

          const expected = {
            appVersion: '1.2.3',
            userId: 123,
            level: 'info',
            message: 'hello world',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });
      });

      describe('Error preservation in SPLAT', () => {
        it('should use Error object as message when Error is first parameter, preserving additional parameters in SPLAT', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Test error message');
          // @ts-expect-error - Argument of type 'Error' is not assignable to parameter of type 'string'.
          logger.error(testError, 'hello', 'world');
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'error',
            message: testError,
            [SPLAT]: ['hello', 'world'],
          };
          expectInfo(actual, expected);
        });

        it('should use Error object as message when Error is first parameter, ignoring object properties but preserving in SPLAT', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Test error message');
          // @ts-expect-error - Argument of type 'Error' is not assignable to parameter of type 'string'.
          logger.error(testError, 'hello', { my: 'object' });
          const actual = captureTransport.lastInfo;

          const expected = {
            userId: 123,
            level: 'error',
            message: testError,
            [SPLAT]: ['hello', { my: 'object' }],
          };
          expectInfo(actual, expected);
        });

        it('should use Error object as message when Error is only parameter', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Database connection failed');
          logger.error(testError);
          const actual = captureTransport.lastInfo;

          const expected = createWinstonInfoFromErrorOnly(testError, {
            level: 'error',
            userId: 123,
          });

          expect(actual?.message).toBeTypeOf('string');
          expect(actual).toBeInstanceOf(Error);
          expect(actual).toBeTypeOf('object');

          expectInfo(actual, expected);
        });

        it('should preserve string message and put Error in first SPLAT position when string message comes first, with only Error in splat', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Database connection failed');
          logger.error('Connection failed', testError);
          const actual = captureTransport.lastInfo;

          const expected = createWinstonInfo(
            {
              userId: 123,
              level: 'error',
              message: 'Connection failed',
            },
            testError,
          );
          expected.stack = testError.stack;

          expect(actual?.message).toBeTypeOf('string');
          expect(actual).not.toBeInstanceOf(Error);
          expect(actual).toBeTypeOf('object');

          expectInfo(actual, expected);
        });

        it('should preserve string message and put Error in first SPLAT position when string message comes first, with extra data', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Database connection failed');
          logger.error('Connection failed', testError, 'extra data');
          const actual = captureTransport.lastInfo;

          const expected = createWinstonInfo(
            {
              userId: 123,
              level: 'error',
              message: 'Connection failed',
              [SPLAT]: ['extra data'],
            },
            testError,
          );
          expected.stack = testError.stack;

          expect(actual?.message).toBeTypeOf('string');
          expect(actual).not.toBeInstanceOf(Error);
          expect(actual).toBeTypeOf('object');

          expectInfo(actual, expected);
        });

        it('should preserve string message when Error is in later splat position', () => {
          const logger = createLogger({
            defaultMeta: { userId: 123 },
            transports: [captureTransport],
          });

          const testError = new Error('Database connection failed');
          logger.error('Connection failed', 'extra data', testError);
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'error',
            message: 'Connection failed',
            userId: 123,
            [SPLAT]: ['extra data', testError],
          } satisfies WinstonInfo;

          expect(actual?.message).toBeTypeOf('string');
          expect(actual).not.toBeInstanceOf(Error);
          expect(actual).toBeTypeOf('object');

          expectInfo(actual, expected);
        });
      });
    });

    describe('DefaultMeta Merging Logic', () => {
      describe('primitive defaultMeta types', () => {
        it('should ignore number defaultMeta and not extract any properties', () => {
          const logger = createLogger({
            defaultMeta: 42,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });

        it('should extract string characters as enumerable properties when string used as defaultMeta', () => {
          const defaultMetaString = 'hello-world';
          const logger = createLogger({
            defaultMeta: defaultMetaString,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            ...extractEnumerableProperties(defaultMetaString),
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };

          expectInfo(actual, expected);
        });

        it('should ignore boolean defaultMeta and not extract any properties', () => {
          const logger = createLogger({
            defaultMeta: true,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });

        it('should ignore null defaultMeta and not extract any properties', () => {
          const logger = createLogger({
            defaultMeta: null,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });

        it('should ignore undefined defaultMeta and not extract any properties', () => {
          const logger = createLogger({
            defaultMeta: undefined,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });

        it('should ignore Date defaultMeta and not extract any properties', () => {
          const testDate = new Date('2025-01-01T00:00:00Z');
          const logger = createLogger({
            defaultMeta: testDate,
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });

        it('should extract array elements as enumerable properties when array used as defaultMeta', () => {
          const logger = createLogger({
            defaultMeta: [1, 2, 3],
            transports: [captureTransport],
          });
          logger.info('test message');
          const actual = captureTransport.lastInfo;

          const expected = {
            ...extractEnumerableProperties([1, 2, 3]),
            level: 'info',
            message: 'test message',
            [SPLAT]: undefined,
          };
          expectInfo(actual, expected);
        });
      });
    });

    describe('defaultMeta.message overrides log message', () => {
      it('should use defaultMeta.message property instead of log message parameter when both are present', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123, message: 'defaultMeta message' },
          transports: [captureTransport],
        });
        logger.info('actual log message');
        const actual = captureTransport.lastInfo;

        const expected = {
          userId: 123,
          level: 'info',
          message: 'defaultMeta message',
          [SPLAT]: undefined,
        };
        expectInfo(actual, expected);
      });
    });
  });

  describe('Console Transport Formatting', () => {
    describe('Custom class formatting', () => {
      it('should extract and format custom class properties in JSON output', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          transports: [spyConsole],
        });

        const customObject = new CustomClass('value');
        logger.info('Custom class test', customObject);

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Custom class test',
          prop: 'value',
        };
        expect(actual).toEqual(expected);
      });

      it('should merge custom class properties with defaultMeta in console JSON output', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          defaultMeta: { userId: 123, appName: 'test' },
          transports: [spyConsole],
        });

        const customObject = new CustomClass('value');
        logger.info('Custom class test', customObject);

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Custom class test',
          userId: 123,
          appName: 'test',
          prop: 'value',
        };
        expect(actual).toEqual(expected);
      });
    });

    describe('Property merging in JSON output', () => {
      it('should merge only first custom class properties in console JSON output, ignoring subsequent classes', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          defaultMeta: { userId: 123 },
          transports: [spyConsole],
        });

        const customObject1 = new CustomClass('value1');
        const customObject2 = new CustomClass('value2');
        logger.info('Multiple custom classes', customObject1, customObject2);

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Multiple custom classes',
          userId: 123,
          prop: 'value1',
        };
        expect(actual).toEqual(expected);
      });

      it('should merge only first custom class properties in console JSON output when classes have different property names', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          defaultMeta: { userId: 123 },
          transports: [spyConsole],
        });

        const customObjectA = new CustomClassA('valueA');
        const customObjectB = new CustomClassB('valueB');
        logger.info('Multiple custom classes', customObjectA, customObjectB);

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Multiple custom classes',
          userId: 123,
          propA: 'valueA',
        };
        expect(actual).toEqual(expected);
      });
    });

    describe('First-object-wins behavior in formatted output', () => {
      it('should merge only first custom class properties in console JSON output when mixed with primitive splat parameters', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          defaultMeta: { userId: 123 },
          transports: [spyConsole],
        });

        const customObject = new CustomClass('value');
        logger.info('Mixed types', customObject, 'extra-string', 42, { sessionId: 'abc' });

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Mixed types',
          userId: 123,
          prop: 'value',
        };
        expect(actual).toEqual(expected);
      });
    });

    describe('Message property concatenation', () => {
      it('concatenates message property with log message in JSON format', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.combine(format.json()) });
        const logger = createLogger({
          transports: [spyConsole],
        });

        logger.info('Hello', { message: 'World', userId: 123 });

        const actual = JSON.parse(spyConsole.lastOutput!);
        const expected = {
          level: 'info',
          message: 'Hello World',
          userId: 123,
        };
        expect(actual).toEqual(expected);
      });

      it('concatenates message property with log message in simple format', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.simple() });
        const logger = createLogger({
          transports: [spyConsole],
        });

        logger.info('Hello', { message: 'World', userId: 123 });

        const actual = spyConsole.lastOutput!;
        const expected = 'info: Hello World {"userId":123}';
        expect(actual).toBe(expected);
      });
    });

    describe('Error formatting in console output', () => {
      it('concatenates Error message with log message and includes stack in JSON format', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'error',
          defaultMeta: { userId: 123 },
          transports: [spyConsole],
        });

        const testError = new Error('Test error message');
        logger.error('hello', testError, 'world');

        const actual = JSON.parse(spyConsole.lastOutput!);
        const expected = {
          level: 'error',
          message: 'hello Test error message',
          stack: testError.stack,
          userId: 123,
        };
        expect(actual).toEqual(expected);
      });

      it('ignores Error object when not in first splat position', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'error',
          defaultMeta: { userId: 123 },
          transports: [spyConsole],
        });

        const testError = new Error('Test error message');
        logger.error('hello', { my: 'object' }, testError);

        const actual = JSON.parse(spyConsole.lastOutput!);
        const expected = {
          level: 'error',
          message: 'hello',
          userId: 123,
          my: 'object',
        };
        expect(actual).toEqual(expected);
      });
    });

    describe('Object property extraction in console output', () => {
      it('extracts custom class properties in JSON format', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          level: 'info',
          transports: [spyConsole],
        });

        const customObject = new CustomClass('value');
        logger.info('Custom class test', customObject);

        const output = spyConsole.lastOutput;
        expect(output).toBeDefined();

        const actual = JSON.parse(output!);
        const expected = {
          level: 'info',
          message: 'Custom class test',
          prop: 'value',
        };
        expect(actual).toEqual(expected);
      });

      it('extracts array elements as enumerable properties in simple format', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.simple() });
        const logger = createLogger({
          format: format.simple(),
          transports: [spyConsole],
        });

        logger.info('Array test', [1, 2, 3]);

        const actual = spyConsole.lastOutput!;
        const expected = 'info: Array test {"0":1,"1":2,"2":3}';
        expect(actual).toBe(expected);
      });

      it('excludes function properties from JSON serialization', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.simple() });
        const logger = createLogger({
          format: format.simple(),
          transports: [spyConsole],
        });

        const callback = () => console.log('callback executed');
        logger.info('Function property test', { userId: 123, callback: callback });

        const actual = spyConsole.lastOutput!;
        const expected = 'info: Function property test {"userId":123}';
        expect(actual).toBe(expected);
      });

      it('ignores non-extractable objects in console output', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.simple() });
        const logger = createLogger({
          format: format.simple(),
          transports: [spyConsole],
        });

        const testFunction = () => 'test';
        logger.info('Function test', testFunction);

        const actual = spyConsole.lastOutput!;
        const expected = 'info: Function test';
        expect(actual).toBe(expected);
      });
    });

    describe('Error Object Processing', () => {
      describe('Error as first splat (concatenation + stack)', () => {
        it('should concatenate Error message with log message and include stack property when Error appears in first splat position', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const testError = new Error('Test error message');
          logger.error('hello', testError, 'world');

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'hello Test error message',
            stack: testError.stack,
            userId: 123,
          };
          expect(actual).toEqual(expected);
        });

        it('should concatenate Error message with log message and include stack property when Error and object in splat', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const testError = new Error('Test error message');
          logger.error('hello', testError, { my: 'object' });

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'hello Test error message',
            stack: testError.stack,
            userId: 123,
          };
          expect(actual).toEqual(expected);
        });
      });

      describe('Error in later splat (no special handling)', () => {
        it('should ignore Error object and exclude stack property when Error appears in second splat position', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const testError = new Error('Test error message');
          logger.error('hello', { my: 'object' }, testError);

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'hello',
            userId: 123,
            my: 'object',
          };
          expect(actual).toEqual(expected);
        });

        it('should merge only first object properties and ignore Error when Error appears in later splat positions', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const testError = new Error('Test error message');
          logger.error('hello', { my: 'object' }, testError, { another: 'object' }, 'extra');

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'hello',
            userId: 123,
            my: 'object',
          };
          expect(actual).toEqual(expected);
        });

        it('should extract Object.create(null) properties in console JSON output', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const nullProtoObject = Object.create(null);
          nullProtoObject.errorCode = 'APOLLO_ERROR';
          nullProtoObject.extensions = { code: 'GRAPHQL_ERROR' };

          logger.error('Apollo error', nullProtoObject);

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'Apollo error',
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            extensions: { code: 'GRAPHQL_ERROR' },
          };
          expect(actual).toEqual(expected);
        });

        it('should extract properties from objects containing Object.create(null) property values in console JSON output', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const nullProtoExtensions = Object.create(null);
          nullProtoExtensions.code = 'GRAPHQL_VALIDATION_FAILED';
          nullProtoExtensions.field = 'userInput';

          const errorObject = {
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
          };

          logger.error('Apollo validation error', errorObject);

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'Apollo validation error',
            userId: 123,
            errorCode: 'APOLLO_ERROR',
            extensions: nullProtoExtensions,
            severity: 'high',
          };
          expect(actual).toEqual(expected);
        });

        it('should extract GraphQLError properties with Object.create(null) extensions in console JSON output', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const error = new GraphQLError('GraphQL validation failed', {
            extensions: Object.create(null),
          });

          logger.error('Apollo error', error);

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            userId: 123,
            extensions: error.extensions,
            locations: error.locations,
            path: error.path,
            stack: error.stack,
          };
          expect(actual).toEqual(expected);
        });

        it('should extract GraphQLError properties with populated Object.create(null) extensions in console JSON output', () => {
          const spyConsole = new SpyConsoleTransport({ format: format.json() });
          const logger = createLogger({
            level: 'error',
            defaultMeta: { userId: 123 },
            transports: [spyConsole],
          });

          const extensions = Object.create(null);
          extensions.code = 'GRAPHQL_VALIDATION_FAILED';
          extensions.field = 'userInput';
          extensions.locations = [{ line: 1, column: 5 }];
          extensions.errorCode = 'APOLLO_ERROR';

          const error = new GraphQLError('GraphQL validation failed', {
            extensions,
          });

          logger.error('Apollo error', error);

          const actual = JSON.parse(spyConsole.lastOutput!);
          const expected = {
            level: 'error',
            message: 'Apollo error GraphQL validation failed',
            userId: 123,
            extensions: extensions,
            locations: error.locations,
            path: error.path,
            stack: error.stack,
          };
          expect(actual).toEqual(expected);
        });
      });
    });

    describe('message property conflicts in output', () => {
      it('should use defaultMeta message property in console JSON output instead of log message parameter when both are present', () => {
        const spyConsole = new SpyConsoleTransport({ format: format.json() });
        const logger = createLogger({
          defaultMeta: { userId: 123, message: 'defaultMeta message' },
          transports: [spyConsole],
        });
        logger.info('actual log message');

        const actual = JSON.parse(spyConsole.lastOutput!);
        const expected = {
          level: 'info',
          message: 'defaultMeta message',
          userId: 123,
        };
        expect(actual).toEqual(expected);
      });
    });
  });
});
