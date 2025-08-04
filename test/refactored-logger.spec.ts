import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger, format, transports } from 'winston';
import TransportStream from 'winston-transport';
import { RefactoredAzureApplicationInsightsTransport, type WinstonInfo, extractErrorsStep, extractMessageStep, extractPropertiesStep, splatSymbol } from '../src/refactored-logger';

class ErrorTransport extends TransportStream {
  public errors: Error[] = [];
  override log(info: any, next: () => void) {
    this.errors = extractErrorsStep(info);
    next();
  }
}

const telemetryHandler = {
  telemetry: { message: '' },
  handleTelemetry: (telemetry: { message: string }) => {
    telemetryHandler.telemetry = telemetry;
  },
};

describe('Refactored AzureApplicationInsightsLogger', () => {
  describe('Transport', () => {
    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler,
    });
    const logger = createLogger({
      transports: [transport],
    });

    it('should work as a winston transport', () => {
      expect(() => {
        logger.info('test message');
      }).not.toThrow();
    });

    it('tesdt', () => {
      logger.error(new Error('hello'));

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe('hello');
    });

    it('should call telemetry handler when logging', () => {
      const expected = 'test message';

      transport.log({ level: 'info', message: expected }, () => {});

      const actual = telemetryHandler.telemetry.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with just message', () => {
      const expected = 'just a message';

      logger.info(expected);

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with just error', () => {
      const expected = 'something failed';

      const error = new Error(expected);
      logger.error(error);

      const actual = telemetryHandler.telemetry.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with message property in object', () => {
      const expected = 'hello world';

      logger.info('hello', { message: 'world' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });
  });

  describe('unconcatenateStep', () => {
    it('should unconcatenate winston message in pipeline step', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello world',
        [splatSymbol]: [{ message: 'world' }],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate different messages', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'goodbye universe',
        [splatSymbol]: [{ message: 'universe' }],
      };

      const result = extractMessageStep(info);
      expect(result.message).toBe('goodbye');
    });

    it('should unconcatenate object message property', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello [object Object]',
        [splatSymbol]: [{ message: { x: '5' } }],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate number message property', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello 50',
        [splatSymbol]: [{ message: 50 }],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate null message property', () => {
      const expected = 'Hello';

      const info: WinstonInfo = {
        level: 'info',
        message: expected,
        [splatSymbol]: [{ message: null }],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate error', () => {
      const expected = 'Hello';
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
      });

      const logger = createLogger({
        transports: [transport],
      });

      const meta = new Error('World');
      logger.info(expected, meta);

      const winstonResult = telemetryHandler.telemetry.message;

      const info: WinstonInfo = {
        level: 'info',
        message: winstonResult,
        [splatSymbol]: [meta],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should return unchanged when no splat', () => {
      const expected = 'hello world';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello world',
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate error objects from splat', () => {
      const expected = 'Error: 1';
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
      });

      const logger = createLogger({
        transports: [transport],
      });

      logger.error('Error: 1', new Error('2'), new Error('3'));

      const winstonResult = telemetryHandler.telemetry.message; // This will be 'Error: 1 2'

      const info: WinstonInfo = {
        level: 'error',
        message: winstonResult,
        [splatSymbol]: [new Error('2'), new Error('3')],
      };

      const result = extractMessageStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });
  });

  describe('extractErrorsStep', () => {
    const transport = new ErrorTransport();
    const logger = createLogger({
      transports: [transport],
    });

    beforeEach(() => {
      transport.errors = [];
    });

    it('should extract error when info is an Error', () => {
      const error = new Error('single error logged');
      logger.error(error);

      const actual = transport.errors;

      expect(actual.length).toBe(1);
      expect(actual[0]).toBe(error);
    });

    it('should return empty array when no errors', () => {
      logger.error('hello world');

      const actual = transport.errors;

      expect(actual.length).toBe(0);
    });

    it('should return all errors', () => {
      logger.error('Error: 1', new Error('2'), new Error('3'));

      const actual = transport.errors;

      expect(actual.length).toBe(2);
    });

    it('should handle empty splat array', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: [],
      };

      const result = extractErrorsStep(info);

      expect(result.length).toBe(0);
    });

    describe('should handle mixed types in splat', () => {
      const error1 = new Error('error1');
      const error2 = new Error('error2');

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: ['string', 42, { userId: 123 }, error1, null, undefined, error2, true],
      };

      it('has two errors in splat', () => {
        const expected = 2;

        const result = extractErrorsStep(info);

        expect(result.length).toBe(expected);
      });

      it('passes first error', () => {
        const expected = error1;

        const result = extractErrorsStep(info);

        expect(result[0]).toBe(expected);
      });

      it('passes second error', () => {
        const expected = error2;

        const result = extractErrorsStep(info);

        expect(result[1]).toBe(expected);
      });
    });

    it('should handle null and undefined items in splat', () => {
      const error = new Error('test');

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: [null, undefined, error, null],
      };

      const result = extractErrorsStep(info);

      expect(result.length).toBe(1);
      expect(result[0]).toBe(error);
    });
  });

  describe('extractPropertiesStep', () => {
    it('should extract single property object directly', () => {
      const expectedProperties = { userId: 123, action: 'login' };

      const info: WinstonInfo = {
        level: 'info',
        message: 'User logged in',
        [splatSymbol]: [expectedProperties],
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({ userId: 123, action: 'login' });
    });

    it('should return empty object when no properties', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'simple message',
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({});
    });

    describe('with multiple property objects', () => {
      const properties1 = { userId: 123 };
      const properties2 = { sessionId: 'abc' };
      const error = new Error('test');

      const info: WinstonInfo = {
        level: 'info',
        message: 'mixed data',
        [splatSymbol]: ['string', 42, properties1, error, null, properties2, true],
      };

      it('should return array with first object at index 2', () => {
        const result = extractPropertiesStep(info) as unknown[];

        expect(result[2]).toEqual({ userId: 123 });
      });

      it('should return array with null preserved at index 3', () => {
        const result = extractPropertiesStep(info) as unknown[];
        // Principle of Least Surprise: preserve nulls to maintain array indices
        // Users expect to see what they logged, where they logged it
        expect(result[3]).toEqual(null);
      });

      it('should return array with second object at index 4', () => {
        const result = extractPropertiesStep(info) as unknown[];
        expect(result[4]).toEqual({ sessionId: 'abc' });
      });
    });

    it('should handle object with message property directly when single', () => {
      const properties = { message: 'world', userId: 123 };

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: [properties],
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({ message: 'world', userId: 123 });
    });

    it('should extract single property object even with multiple errors', () => {
      const properties = { key1: 'hello', key2: 'world' };
      const error1 = new Error('error1');
      const error2 = new Error('error2');

      const info: WinstonInfo = {
        level: 'error',
        message: 'oh noes',
        [splatSymbol]: [error1, error2, properties],
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({ key1: 'hello', key2: 'world' });
    });

    it('should return empty object when splat contains only errors', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: 'error occurred',
        [splatSymbol]: [new Error('test error')],
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({});
    });
  });

  describe('Object Type Discrimination Tests', () => {
    it('should extract plain object directly', () => {
      const plainObject = { userId: 123, action: 'login' };
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [plainObject],
      };

      const result = extractPropertiesStep(info);

      expect(result).toEqual({ userId: 123, action: 'login' });
    });

    it('should handle array as single item', () => {
      const arrayObject = [1, 2, 3];
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [arrayObject],
      };

      const result = extractPropertiesStep(info);

      // With prototype check: Arrays are wrapped to preserve them as values
      // This prevents array indices from being extracted as properties
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it('should handle Date as single item', () => {
      const dateObject = new Date('2025-01-01');
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [dateObject],
      };

      const result = extractPropertiesStep(info);

      // With prototype check: Date is wrapped so it's preserved in Azure telemetry
      // This ensures the date appears as { 0: "2025-01-01T..." } instead of being ignored
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([dateObject]);
    });

    it('should preserve dates by wrapping them in arrays (failing test for desired behavior)', () => {
      const dateObject = new Date('2025-01-01');
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [dateObject],
      };

      const result = extractPropertiesStep(info);

      // DESIRED BEHAVIOR: Date should be wrapped so it's preserved in Azure telemetry
      // This test will fail with current implementation, but shows what we want
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([dateObject]);
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
        [splatSymbol]: [customObject],
      };

      const result = extractPropertiesStep(info);

      // With prototype check: Custom classes are wrapped in arrays (preserved as objects)
      // This prevents their properties from being extracted directly
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([customObject]);
    });

    it('should handle primitives without typeof check (testing if prototype check is sufficient)', () => {
      // Test what happens with primitives when we only have prototype check
      const stringValue = 'hello';
      const numberValue = 42;
      const booleanValue = true;

      const stringInfo: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [stringValue],
      };

      const numberInfo: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [numberValue],
      };

      const booleanInfo: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [booleanValue],
      };

      // All primitives should be wrapped in arrays since they fail prototype check
      expect(extractPropertiesStep(stringInfo)).toEqual(['hello']);
      expect(extractPropertiesStep(numberInfo)).toEqual([42]);
      expect(extractPropertiesStep(booleanInfo)).toEqual([true]);

      // None should cause errors even without typeof check
    });

    it('should handle single null value without crashing', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [null],
      };

      // This should not crash when calling isPlainObject(null)
      const result = extractPropertiesStep(info);
      expect(result).toEqual([null]);
    });
  });

  describe('Integration - Full Pipeline', () => {
    const propertiesTransport = new (class extends TransportStream {
      public properties: Record<string, unknown> | unknown[] = {};
      override log(info: any, next: () => void) {
        // Simulate the full pipeline
        const unconcatenated = extractMessageStep(info);
        this.properties = extractPropertiesStep(unconcatenated);
        next();
      }
    })();

    const logger = createLogger({
      transports: [propertiesTransport],
    });

    beforeEach(() => {
      propertiesTransport.properties = {};
    });

    describe('Message only', () => {
      it('should return empty properties when logging just a message', () => {
        logger.info('Just a message');

        expect(propertiesTransport.properties).toEqual({});
      });
    });

    describe('Message + Single Primitive', () => {
      it('should extract single string as array', () => {
        logger.info('Single primitive', 'important-value');

        expect(propertiesTransport.properties).toEqual(['important-value']);
      });

      it('should extract single number as array', () => {
        logger.info('Single number', 42);

        expect(propertiesTransport.properties).toEqual([42]);
      });

      it('should extract single boolean as array', () => {
        logger.info('Single boolean', true);

        expect(propertiesTransport.properties).toEqual([true]);
      });
    });

    describe('Message + Single Object', () => {
      it('should extract single object properties directly', () => {
        logger.info('User action', { userId: 123, action: 'login' });

        expect(propertiesTransport.properties).toEqual({
          userId: 123,
          action: 'login',
        });
      });

      it('should handle object with message property directly', () => {
        logger.info('Action', { message: 'world', userId: 123 });

        expect(propertiesTransport.properties).toEqual({
          message: 'world',
          userId: 123,
        });
      });
    });

    describe('Message + Single Error', () => {
      it('should return empty properties when logging with single error', () => {
        logger.error('Error occurred', new Error('test error'));

        expect(propertiesTransport.properties).toEqual({});
      });
    });

    describe('Message + Multiple Objects', () => {
      it('should return multiple objects as array', () => {
        logger.info('Complex action', { userId: 123 }, { sessionId: 'abc-456' });

        expect(propertiesTransport.properties).toEqual([{ userId: 123 }, { sessionId: 'abc-456' }]);
      });
    });

    describe('Message + Multiple Primitives', () => {
      it('should return multiple primitives as array', () => {
        logger.info('Mixed primitives', 'user123', 42, true);

        expect(propertiesTransport.properties).toEqual(['user123', 42, true]);
      });
    });

    describe('Message + Mixed Types (Objects + Primitives)', () => {
      it('should return all non-error items as array', () => {
        logger.info('Mixed types', { userId: 123 }, 'session-abc', 42, { contextId: 'ctx-123' });

        expect(propertiesTransport.properties).toEqual([{ userId: 123 }, 'session-abc', 42, { contextId: 'ctx-123' }]);
      });
    });

    describe('Message + Mixed Types Including Errors', () => {
      it('should extract only non-error items, ignoring errors (single object)', () => {
        logger.error('Error occurred', new Error('test error'), { contextId: 'ctx-123' });

        expect(propertiesTransport.properties).toEqual({
          contextId: 'ctx-123',
        });
      });

      it('should extract objects and primitives while ignoring errors (multiple items)', () => {
        logger.error('Complex error', new Error('error1'), { userId: 123 }, 'debug-info', new Error('error2'), 42);

        expect(propertiesTransport.properties).toEqual([{ userId: 123 }, 'debug-info', 42]);
      });
    });
  });

  describe('Winston behavior with edge cases', () => {
    it('should see how winston handles functions', () => {
      const logger = createLogger({
        transports: [
          new transports.Console({
            format: format.simple(),
          }),
        ],
      });

      const testFunction = () => 'test';
      logger.info('Function test', testFunction);
    });

    it('should see how winston handles arrays', () => {
      const logger = createLogger({
        transports: [
          new transports.Console({
            format: format.simple(),
          }),
        ],
      });

      logger.info('Array test', [1, 2, 3]);
    });

    it('should see how winston handles dates', () => {
      const logger = createLogger({
        transports: [
          new transports.Console({
            format: format.simple(),
          }),
        ],
      });

      logger.info('Date test', new Date('2025-01-01'));
    });

    it('should see how winston handles regex', () => {
      const logger = createLogger({
        transports: [
          new transports.Console({
            format: format.simple(),
          }),
        ],
      });

      logger.info('RegExp test', /hello/g);
    });

    it('should see how winston handles custom classes', () => {
      const logger = createLogger({
        transports: [
          new transports.Console({
            format: format.simple(),
          }),
        ],
      });

      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }

      logger.info('Custom class test', new CustomClass());
    });
  });
});
