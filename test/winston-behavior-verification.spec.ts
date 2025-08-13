import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger, format, transports } from 'winston';
import type { WinstonInfo } from '../src';
import { DebugTransport } from './DebugTransport';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { createWinstonInfo } from './createWinstonInfoWithErrorInSplat';
import { SpyConsoleTransport } from './spies/SpyConsoleTransport';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

function expectInfoKeys(info: WinstonInfo, expectedKeys: string[]) {
  const actualKeys = Object.keys(info).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  expect(actualKeys).toEqual(sortedExpectedKeys);
}

function expectInfoEntries(info: WinstonInfo, expectedObject: WinstonInfo) {
  const expectedSplat = expectedObject[SPLAT];
  const actualSplat = info[SPLAT];

  expect(actualSplat).toEqual(expectedSplat);

  for (const [key, value] of Object.entries(expectedObject)) {
    console.log('Expecting key:', key, 'to have value:', value);
    expect(info[key]).toBe(value);
  }
}

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
        const capturedInfo = captureTransport.capturedWinstonInfo[0];

        // Assert Winston's actual behavior: splat wins conflicts, both defaultMeta and splat properties present
        expect(capturedInfo.appVersion).toBe('2.3.4'); // splat wins
        expect(capturedInfo.userId).toBe(123); // defaultMeta preserved
        expect(capturedInfo.sessionId).toBe('abc'); // splat added
        expect(capturedInfo.level).toBe('info');
        expect(capturedInfo.message).toBe('hello');
        expect(capturedInfo[SPLAT]).toEqual([{ appVersion: '2.3.4', sessionId: 'abc' }]);
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
        const capturedInfo = captureTransport.capturedWinstonInfo[0];

        // Assert Winston's "first object only" behavior
        expect(capturedInfo.appVersion).toBe('1.2.3');
        expect(capturedInfo.userId).toBe(123);
        expect(capturedInfo.sessionId).toBe('abc');
        expect(capturedInfo.requestId).toBeUndefined();
        expect(capturedInfo.level).toBe('info');
        expect(capturedInfo.message).toBe('hello');
        expect(capturedInfo[SPLAT]).toEqual([{ sessionId: 'abc' }, { requestId: 'req-123' }, 'extra-data']);
      });
    });

    describe('Raw: primitive first splat parameters', () => {
      it('should ignore number primitives as first splat parameter and not extract properties', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', 42, { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([42, { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should ignore string primitives as first splat parameter and not extract properties', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', 'hello', { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual(['hello', { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should ignore boolean primitives as first splat parameter and not extract properties', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', true, { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([true, { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should ignore null primitives as first splat parameter and not extract properties', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', null, { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([null, { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should ignore Date objects as first splat parameter and not extract properties', () => {
        const testDate = new Date('2025-01-01T00:00:00Z');
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', testDate, { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([testDate, { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should extract array elements as enumerable properties but ignore subsequent splat objects', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });
        logger.info('test', [1, 2, 3], { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('test');
        expect(info['0']).toBe(1);
        expect(info['1']).toBe(2);
        expect(info['2']).toBe(3);
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([[1, 2, 3], { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'level', 'message', '0', '1', '2']);
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
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.prop).toBe('value');
        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toEqual([new CustomClass('value')]);
      });

      it('should extract custom class properties when no defaultMeta is present', () => {
        const logger = createLogger({
          transports: [captureTransport],
        });

        const customObject = new CustomClass('value');
        logger.info('test message', customObject);
        const info = captureTransport.lastInfo;

        expect(info.prop).toBe('value');
        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toEqual([new CustomClass('value')]);
        expectInfoKeys(info, ['prop', 'level', 'message']);
      });

      it('should extract properties from first custom class only, ignoring properties from subsequent classes with same property names', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const customObject1 = new CustomClass('value1');
        const customObject2 = new CustomClass('value2');
        logger.info('test message', customObject1, customObject2);
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.prop).toBe('value1');
        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toEqual([customObject1, customObject2]);
        expectInfoKeys(info, ['userId', 'prop', 'level', 'message']);
      });

      it('should extract properties from first custom class only, ignoring properties from subsequent classes with different property names', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const customObjectA = new CustomClassA('valueA');
        const customObjectB = new CustomClassB('valueB');
        logger.info('test message', customObjectA, customObjectB);
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.propA).toBe('valueA');
        expect(info.propB).toBeUndefined();
        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toEqual([customObjectA, customObjectB]);
        expectInfoKeys(info, ['userId', 'propA', 'level', 'message']);
      });

      it('should extract properties from first custom class only, ignoring subsequent non-object splat parameters', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const customObject = new CustomClass('value');
        logger.info('test message', customObject, 'extra-string', 42, { sessionId: 'abc' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.prop).toBe('value');
        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info.sessionId).toBeUndefined();
        expect(info[SPLAT]).toEqual([customObject, 'extra-string', 42, { sessionId: 'abc' }]);
        expectInfoKeys(info, ['userId', 'prop', 'level', 'message']);
      });

      it('should extract properties from first object and preserve Error in SPLAT, ignoring subsequent objects', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const testError = new Error('Test error message');
        logger.error('hello', { my: 'object' }, testError);
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.my).toBe('object');
        expect(info.level).toBe('error');
        expect(info.message).toBe('hello');
        expect(info[SPLAT]).toEqual([{ my: 'object' }, testError]);
        expectInfoKeys(info, ['userId', 'my', 'level', 'message']);
      });

      it('should extract properties from first object only, preserving Error and subsequent items in SPLAT', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const testError = new Error('Test error message');
        logger.error('hello', { my: 'object' }, testError, { another: 'object' }, 'extra');
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.my).toBe('object');
        expect(info.level).toBe('error');
        expect(info.message).toBe('hello');
        expect(info.another).toBeUndefined();
        expect(info[SPLAT]).toEqual([{ my: 'object' }, testError, { another: 'object' }, 'extra']);
        expectInfoKeys(info, ['userId', 'my', 'level', 'message']);
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
        const capturedInfo = captureTransport.capturedWinstonInfo[0];

        expect(capturedInfo.appVersion).toBe('1.2.3');
        expect(capturedInfo.userId).toBe(123);
        expect(capturedInfo.level).toBe('info');
        expect(capturedInfo.message).toBe('hello world');
        expect(capturedInfo[SPLAT]).toBeUndefined();
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
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('error');
        expect(info.message).toBe(testError);
        expect(info.stack).toBeUndefined();
        expect(info[SPLAT]).toEqual(['hello', 'world']);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should use Error object as message when Error is first parameter, ignoring object properties but preserving in SPLAT', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const testError = new Error('Test error message');
        // @ts-expect-error - Argument of type 'Error' is not assignable to parameter of type 'string'.
        logger.error(testError, 'hello', { my: 'object' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('error');
        expect(info.message).toBe(testError);
        expect(info.my).toBeUndefined();
        expect(info[SPLAT]).toEqual(['hello', { my: 'object' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
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

        expectInfoEntries(actual, expected);
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

        expect(actual.message).toBeTypeOf('string');
        expect(actual).not.toBeInstanceOf(Error);
        expect(actual).toBeTypeOf('object');

        expectInfoEntries(actual, expected);
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

        console.log('Actual splat:', actual[SPLAT]);

        expect(actual.message).toBeTypeOf('string');
        expect(actual).not.toBeInstanceOf(Error);
        expect(actual).toBeTypeOf('object');

        expectInfoEntries(actual, expected);
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

        expectInfoEntries(actual, expected);
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
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('info');
        expect(info.message).toBe('defaultMeta message');
        expect(info[SPLAT]).toBeUndefined();

        expectInfoKeys(info, ['userId', 'message', 'level']);
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
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['message', 'level']);
      });

      it('should extract string characters as enumerable properties when string used as defaultMeta', () => {
        const expected = 'hello-world';
        const logger = createLogger({
          defaultMeta: expected,
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();

        expectInfoKeys(info, ['0', '1', '10', '2', '3', '4', '5', '6', '7', '8', '9', 'message', 'level']);
        expectInfoEntries(info, expected as unknown as WinstonInfo);
      });

      it('should ignore boolean defaultMeta and not extract any properties', () => {
        const logger = createLogger({
          defaultMeta: true,
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['message', 'level']);
      });

      it('should ignore null defaultMeta and not extract any properties', () => {
        const logger = createLogger({
          defaultMeta: null,
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['message', 'level']);
      });

      it('should ignore undefined defaultMeta and not extract any properties', () => {
        const logger = createLogger({
          defaultMeta: undefined,
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['message', 'level']);
      });

      it('should ignore Date defaultMeta and not extract any properties', () => {
        const testDate = new Date('2025-01-01T00:00:00Z');
        const logger = createLogger({
          defaultMeta: testDate,
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['message', 'level']);
      });

      it('should extract array elements as enumerable properties when array used as defaultMeta', () => {
        const logger = createLogger({
          defaultMeta: [1, 2, 3],
          transports: [captureTransport],
        });
        logger.info('test message');
        const info = captureTransport.lastInfo;

        expect(info.level).toBe('info');
        expect(info.message).toBe('test message');
        expect(info[SPLAT]).toBeUndefined();
        expectInfoKeys(info, ['0', '1', '2', 'message', 'level']);
        expect(info['0']).toBe(1);
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

describe('Winston Message Behavior', () => {
  it('should demonstrate winston behavior with json format', () => {
    const logger = createLogger({
      format: format.combine(format.json()),
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing with JSON format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });

  it('should demonstrate winston behavior without json format', () => {
    const logger = createLogger({
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing without JSON format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });

  it('should demonstrate winston behavior with simple format', () => {
    const logger = createLogger({
      format: format.simple(),
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing with simple format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });

  describe('Edge case behaviors', () => {
    const logger = createLogger({
      format: format.simple(),
      transports: [new transports.Console({ silent: false })],
    });

    it('should demonstrate winston behavior with functions', () => {
      console.log('=== Testing with functions ===');
      const testFunction = () => 'test';
      logger.info('Function test', testFunction);
    });

    it('should demonstrate winston behavior with function as property', () => {
      console.log('=== Testing with function as property ===');
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });
    });

    it('should demonstrate winston behavior with arrays', () => {
      console.log('=== Testing with arrays ===');
      logger.info('Array test', [1, 2, 3]);
    });

    it('should demonstrate winston behavior with dates', () => {
      console.log('=== Testing with dates ===');
      logger.info('Date test', new Date('2025-01-01'));
    });

    it('should demonstrate winston behavior with regex', () => {
      console.log('=== Testing with regex ===');
      logger.info('Regex test', /hello/g);
    });

    it('should demonstrate winston behavior with custom classes', () => {
      console.log('=== Testing with custom classes ===');
      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }

      logger.info('Custom class test', new CustomClass());
    });
  });

  describe('Splat inspection', () => {
    it('should show what Winston puts in the splat for each type', () => {
      const debugTransport = new DebugTransport();

      const logger = createLogger({
        transports: [debugTransport],
      });

      console.log('--- Function directly ---');
      const testFunction = () => 'test';
      logger.info('Function test', testFunction);

      console.log('--- Function as property ---');
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });

      console.log('--- Array ---');
      logger.info('Array test', [1, 2, 3]);

      console.log('--- Date ---');
      logger.info('Date test', new Date('2025-01-01'));

      console.log('--- Custom class ---');
      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }
      logger.info('Custom class test', new CustomClass());

      console.log('--- Error object ---');
      logger.error(new Error('Database error'));

      console.log('--- Error with message ---');
      logger.error('Custom message', new Error('Database error'));
    });
  });
});
