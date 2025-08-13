import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger, format } from 'winston';
import type { WinstonInfo } from '../src';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { createWinstonInfo } from './createWinstonInfoWithErrorInSplat';
import { expectInfo } from './expectInfoEntries';
import { expectInfoKeys } from './expectInfoKeys';
import { SpyConsoleTransport } from './spies/SpyConsoleTransport';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

// biome-ignore lint/complexity/noBannedTypes: this is intended
const objectionise = (arg: {}) => {
  return Object.fromEntries(Object.entries(arg));
};

describe('Winston behavior verification', () => {
  class CustomClass {
    constructor(public prop: string) {}
  }

  class CustomClassA {
    constructor(public propA: string) {}
  }

  class CustomClassB {
    constructor(public propB: string) {}
  }

  const captureTransport = new SpyWinstonTransport();

  describe('Splat Processing Logic', () => {
    describe('Raw: basic splat vs defaultMeta conflicts', () => {
      it('should merge splat properties with defaultMeta, with splat taking precedence over conflicts', () => {
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

    describe('Raw: multiple splat items (first object wins)', () => {
      it('should merge only first splat object properties, ignoring subsequent objects', () => {
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

    describe('Raw: primitive first splat parameters', () => {
      it('should ignore number primitives as first splat parameter and not extract properties', () => {
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

      it('should ignore string primitives as first splat parameter and not extract properties', () => {
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

      it('should ignore boolean primitives as first splat parameter and not extract properties', () => {
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

      it('should ignore null primitives as first splat parameter and not extract properties', () => {
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

      it('should ignore Date objects as first splat parameter and not extract properties', () => {
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

      it('should extract array elements as enumerable properties but ignore subsequent splat objects', () => {
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

      it('should ignore function primitives as first splat parameter and not extract properties', () => {
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

      it('should ignore bigint primitives as first splat parameter and not extract properties', () => {
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

    describe('Raw: custom class property extraction', () => {
      it('should extract custom class properties and merge with defaultMeta', () => {
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

      it('should extract custom class properties when no defaultMeta is present', () => {
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

      it('should extract properties from first custom class only, ignoring properties from subsequent classes with same property names', () => {
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

      it('should extract properties from first custom class only, ignoring properties from subsequent classes with different property names', () => {
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

      it('should extract properties from first custom class only, ignoring subsequent non-object splat parameters', () => {
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

      it('should extract properties from first object and preserve Error in SPLAT, ignoring subsequent objects', () => {
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

      it('should extract properties from first object only, preserving Error and subsequent items in SPLAT', () => {
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
    });

    describe('Raw: no splat scenarios', () => {
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

    describe('Raw: Error preservation in SPLAT', () => {
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

        expect(actual.message).toBeTypeOf('string');
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

        expect(actual.message).toBeTypeOf('string');
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

        console.log('Actual splat:', actual[SPLAT]);

        expect(actual.message).toBeTypeOf('string');
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

        expect(actual.message).toBeTypeOf('string');
        expect(actual).not.toBeInstanceOf(Error);
        expect(actual).toBeTypeOf('object');

        expectInfo(actual, expected);
      });
    });
  });

  describe('Message Property Handling', () => {
    describe('Raw: defaultMeta.message overrides log message', () => {
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

    describe('Console: message property conflicts in output', () => {
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

  describe('Error Object Processing', () => {
    describe('Console: Error as first splat (concatenation + stack)', () => {
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

    describe('Console: Error in later splat (no special handling)', () => {
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
    });
  });

  describe('DefaultMeta Merging Logic', () => {
    describe('Raw: primitive defaultMeta types', () => {
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
          ...objectionise(defaultMetaString),
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
          ...objectionise([1, 2, 3]),
          level: 'info',
          message: 'test message',
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
  });
});

describe('Console Output Format Verification', () => {
  it('should handle message property conflicts in JSON format console output', () => {
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

  it('should format properties correctly in JSON console output without message conflicts #1', () => {
    const spyConsole = new SpyConsoleTransport({ format: format.combine(format.json()) });
    const logger = createLogger({
      transports: [spyConsole],
    });

    logger.info('Hello world');

    const actual = JSON.parse(spyConsole.lastOutput!);
    const expected = {
      level: 'info',
      message: 'Hello world',
    };
    expect(actual).toEqual(expected);
  });

  it('should format properties correctly in JSON console output without message conflicts #2', () => {
    const spyConsole = new SpyConsoleTransport({ format: format.combine(format.json()) });
    const logger = createLogger({
      transports: [spyConsole],
    });

    logger.info('Hello world');

    const actual = JSON.parse(spyConsole.lastOutput!);
    const expected = {
      level: 'info',
      message: 'Hello world',
    };

    expect(actual).toEqual(expected);
  });

  it('should format properties correctly in simple format console output', () => {
    const spyConsole = new SpyConsoleTransport({ format: format.simple() });
    const logger = createLogger({
      transports: [spyConsole],
    });

    logger.info('Hello', { message: 'World', userId: 123 });

    const actual = spyConsole.lastOutput!;
    const expected = 'info: Hello World {"userId":123}';
    expect(actual).toBe(expected);
  });

  describe('Edge case behaviors', () => {
    const spyConsole = new SpyConsoleTransport({ format: format.simple() });
    const logger = createLogger({
      format: format.simple(),
      transports: [spyConsole],
    });

    it('should demonstrate winston behavior with functions', () => {
      const testFunction = () => 'test';
      logger.info('Function test', testFunction);

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Function test';
      expect(actual).toBe(expected);
    });

    it('should demonstrate winston behavior with function as property', () => {
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Function property test {"userId":123}';
      expect(actual).toBe(expected);
    });

    it('should demonstrate winston behavior with arrays', () => {
      logger.info('Array test', [1, 2, 3]);

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Array test {"0":1,"1":2,"2":3}';
      expect(actual).toBe(expected);
    });

    it('should demonstrate winston behavior with dates', () => {
      logger.info('Date test', new Date('2025-01-01'));

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Date test';
      expect(actual).toBe(expected);
    });

    it('should demonstrate winston behavior with regex', () => {
      logger.info('Regex test', /hello/g);

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Regex test';
      expect(actual).toBe(expected);
    });

    it('should demonstrate winston behavior with custom classes', () => {
      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }

      logger.info('Custom class test', new CustomClass());

      const actual = spyConsole.lastOutput!;
      const expected = 'info: Custom class test {"prop":"value"}';
      expect(actual).toBe(expected);
    });
  });

  describe('Splat inspection', () => {
    const spyTransport = new SpyWinstonTransport();
    const logger = createLogger({
      transports: [spyTransport],
    });

    it('should show what Winston puts in the splat for function as property', () => {
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });

      const actual = spyTransport.lastInfo;

      const expected = {
        callback: callback,
        userId: 123,
        level: 'info',
        message: 'Function property test',
        [SPLAT]: [{ userId: 123, callback: callback }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when function is used as message property value', () => {
      const callback = () => console.log('callback executed');
      logger.info('Hello', { message: callback });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: `Hello ${callback}`,
        [SPLAT]: [{ message: callback }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when string is used as message property value', () => {
      logger.info('Hello', { message: 'World' });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello World',
        [SPLAT]: [{ message: 'World' }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when number is used as message property value', () => {
      logger.info('Hello', { message: 42 });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello 42',
        [SPLAT]: [{ message: 42 }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when zero is used as message property value', () => {
      logger.info('Hello', { message: 0 });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello',
        [SPLAT]: [{ message: 0 }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when boolean true is used as message property value', () => {
      logger.info('Hello', { message: true });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello true',
        [SPLAT]: [{ message: true }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when boolean false is used as message property value', () => {
      logger.info('Hello', { message: false });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello',
        [SPLAT]: [{ message: false }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when bigint is used as message property value', () => {
      logger.info('Hello', { message: 123n });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello 123',
        [SPLAT]: [{ message: 123n }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when bigint zero is used as message property value', () => {
      logger.info('Hello', { message: 0n });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello',
        [SPLAT]: [{ message: 0n }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when null is used as message property value', () => {
      logger.info('Hello', { message: null });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello',
        [SPLAT]: [{ message: null }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when undefined is used as message property value', () => {
      logger.info('Hello', { message: undefined });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello',
        [SPLAT]: [{ message: undefined }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when object is used as message property value', () => {
      logger.info('Hello', { message: { nested: 'value' } });

      const actual = spyTransport.lastInfo;

      const expected = {
        level: 'info',
        message: 'Hello [object Object]',
        [SPLAT]: [{ message: { nested: 'value' } }],
      };
      expectInfo(actual, expected);
    });

    it('should show what Winston does when empty object is used as message property value', () => {
      logger.info('Hello', { message: {} });

      const info = spyTransport.lastInfo;

      const expected = 'Hello [object Object]';
      const actual = info.message;

      expect(actual).toBe(expected);
      expect(info.level).toBe('info');
      expect(info[SPLAT]).toEqual([{ message: {} }]);
    });

    it('should show what Winston does when custom class is used as message property value', () => {
      class TestClass {
        constructor(public prop: string) {}
      }
      const customObject = new TestClass('test');
      logger.info('Hello', { message: customObject });

      const info = spyTransport.lastInfo;

      const expected = 'Hello [object Object]';
      const actual = info.message;

      expect(actual).toBe(expected);
      expect(info.level).toBe('info');
      expect(info[SPLAT]).toEqual([{ message: customObject }]);
    });

    it('should show what Winston does when array is used as message property value', () => {
      logger.info('Hello', { message: [1, 2, 3] });

      const info = spyTransport.lastInfo;

      const expected = 'Hello 1,2,3';
      const actual = info.message;

      expect(actual).toBe(expected);
      expect(info.level).toBe('info');
      expect(info[SPLAT]).toEqual([{ message: [1, 2, 3] }]);
    });

    it('should show what Winston does when empty array is used as message property value', () => {
      logger.info('Hello', { message: [] });

      const info = spyTransport.lastInfo;

      const expected = 'Hello ';
      const actual = info.message;

      expect(actual).toBe(expected);
      expect(info.level).toBe('info');
      expect(info[SPLAT]).toEqual([{ message: [] }]);
    });

    it('should show what Winston does when Date is used as message property value', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      logger.info('Hello', { message: testDate });

      const info = spyTransport.lastInfo;

      const expected = `Hello ${testDate.toString()}`;
      const actual = info.message;

      expect(actual).toBe(expected);
      expect(info.level).toBe('info');
      expect(info[SPLAT]).toEqual([{ message: testDate }]);
    });
  });
});
