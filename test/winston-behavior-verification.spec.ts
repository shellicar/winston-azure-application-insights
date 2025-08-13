import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger, format } from 'winston';
import * as winston from 'winston';
import type { WinstonInfo } from '../src';
import { SpyConsoleTransport } from './spies/SpyConsoleTransport';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

function expectInfoKeys(info: WinstonInfo, expectedKeys: string[]) {
  const actualKeys = Object.keys(info).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  expect(actualKeys).toEqual(sortedExpectedKeys);
}

function expectInfoEntries(info: WinstonInfo, expectedObject: object | string) {
  for (const [key, value] of Object.entries(expectedObject)) {
    expect(info[key]).toBe(value);
  }
}

class CustomClass {
  constructor(public prop: string) {}
}

class CustomClassA {
  constructor(public propA: string) {}
}

class CustomClassB {
  constructor(public propB: string) {}
}

describe('Winston behavior verification', () => {
  const captureTransport = new SpyWinstonTransport();

  describe('Splat Processing Logic', () => {
    describe('Raw: basic splat vs defaultMeta conflicts', () => {
      it('should verify what Winston does with defaultMeta vs splat conflicts', () => {
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
      it('should verify Winston behavior with multiple splat items', () => {
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
      it('should handle number as first splat with object defaultMeta', () => {
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

      it('should handle string as first splat with object defaultMeta', () => {
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

      it('should handle boolean as first splat with object defaultMeta', () => {
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

      it('should handle null as first splat with object defaultMeta', () => {
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

      it('should handle Date as first splat with object defaultMeta', () => {
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

      it('should handle array as first splat with object defaultMeta', () => {
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
      it('should verify Winston behavior with custom class as splat (with defaultMeta)', () => {
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

      it('should verify Winston behavior with custom class as only splat (no defaultMeta)', () => {
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

      it('should verify Winston behavior with multiple custom classes as splat (same property name)', () => {
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

      it('should verify Winston behavior with multiple custom classes as splat (different property names)', () => {
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

      it('should verify Winston behavior with custom class mixed with other types', () => {
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

      it('should verify Winston behavior with object + Error as 2nd splat', () => {
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

      it('should verify Winston behavior with object + Error + more items', () => {
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
      it('should verify Winston behavior with no splat', () => {
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
      it('should verify Winston behavior with Error as first parameter + primitives', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const testError = new Error('Test error message');
        (logger as any).error(testError, 'hello', 'world');
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('error');
        expect(info.message).toBe(testError);
        expect(info.stack).toBeUndefined();
        expect(info[SPLAT]).toEqual(['hello', 'world']);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });

      it('should verify Winston behavior with Error as first parameter + object', () => {
        const logger = createLogger({
          defaultMeta: { userId: 123 },
          transports: [captureTransport],
        });

        const testError = new Error('Test error message');
        (logger as any).error(testError, 'hello', { my: 'object' });
        const info = captureTransport.lastInfo;

        expect(info.userId).toBe(123);
        expect(info.level).toBe('error');
        expect(info.message).toBe(testError);
        expect(info.my).toBeUndefined();
        expect(info[SPLAT]).toEqual(['hello', { my: 'object' }]);
        expectInfoKeys(info, ['userId', 'level', 'message']);
      });
    });
  });

  describe('Message Property Handling', () => {
    describe('Raw: defaultMeta.message overrides log message', () => {
      it('should handle defaultMeta with message property conflict', () => {
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
      it('should verify console transport uses defaultMeta message over log message', () => {
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
      it('should verify console transport excludes stack when Error is in splat + string', () => {
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

      it('should verify console transport includes Error message when Error is in splat', () => {
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
      it('should verify console transport excludes stack when Error is 2nd splat parameter', () => {
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

      it('should verify console transport only merges first object when Error is in splat', () => {
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
      it('should handle number defaultMeta', () => {
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

      it('should handle string defaultMeta', () => {
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
        expectInfoEntries(info, expected);
      });

      it('should handle boolean defaultMeta', () => {
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

      it('should handle null defaultMeta', () => {
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

      it('should handle undefined defaultMeta', () => {
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

      it('should handle Date defaultMeta', () => {
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

      it('should handle array defaultMeta', () => {
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
      it('should verify console transport formats custom class properties', () => {
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

      it('should verify console transport merges custom class with defaultMeta', () => {
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
      it('should verify console transport only merges first custom class properties', () => {
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

      it('should verify console transport merges only first custom class properties', () => {
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
      it('should verify console transport only merges first custom class when mixed with primitives', () => {
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
