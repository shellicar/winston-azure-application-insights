import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger, format, transports } from 'winston';
import TransportStream from 'winston-transport';
import { RefactoredAzureApplicationInsightsTransport, type WinstonInfo, extractErrorsStep, extractPropertiesStep, splatSymbol, unconcatenateStep } from '../src/refactored-logger';

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

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate different messages', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'goodbye universe',
        [splatSymbol]: [{ message: 'universe' }],
      };

      const result = unconcatenateStep(info);
      expect(result.message).toBe('goodbye');
    });

    it('should unconcatenate object message property', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello [object Object]',
        [splatSymbol]: [{ message: { x: '5' } }],
      };

      const result = unconcatenateStep(info);
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

      const result = unconcatenateStep(info);
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

      const result = unconcatenateStep(info);
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

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should return unchanged when no splat', () => {
      const expected = 'hello world';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello world',
      };

      const result = unconcatenateStep(info);
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

      const result = unconcatenateStep(info);
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

      it('should wrap with custom0 for first object', () => {
        const result = extractPropertiesStep(info);

        expect(result.custom0).toEqual({ userId: 123 });
      });

      it('should wrap with custom1 for second object', () => {
        const result = extractPropertiesStep(info);
        expect(result.custom1).toEqual({ sessionId: 'abc' });
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
  });

  describe('Integration - Full Pipeline', () => {
    const propertiesTransport = new (class extends TransportStream {
      public properties: Record<string, unknown> = {};
      override log(info: any, next: () => void) {
        // Simulate the full pipeline
        const unconcatenated = unconcatenateStep(info);
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

    it('should extract properties from logger.info with single object', () => {
      logger.info('User action', { userId: 123, action: 'login' });

      expect(propertiesTransport.properties).toEqual({
        userId: 123,
        action: 'login',
      });
    });

    it('should extract properties from logger.info with multiple objects', () => {
      logger.info('Complex action', { userId: 123 }, { sessionId: 'abc-456' });

      expect(propertiesTransport.properties).toEqual({
        custom0: { userId: 123 },
        custom1: { sessionId: 'abc-456' },
      });
    });

    it('should handle mixed types including errors', () => {
      logger.error('Error occurred', new Error('test error'), { contextId: 'ctx-123' });

      expect(propertiesTransport.properties).toEqual({
        contextId: 'ctx-123',
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
