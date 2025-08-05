import { beforeEach, describe, expect, it } from 'vitest';
import { config, createLogger } from 'winston';
import TransportStream from 'winston-transport';
import { RefactoredAzureApplicationInsightsTransport, type SeverityMapping, type TelemetryData, TelemetrySeverity, type WinstonInfo, type WinstonLevels, extractErrorsStep, extractMessageStep, extractPropertiesStep, splatSymbol } from '../src/refactored-logger';

class ErrorTransport extends TransportStream {
  public errors: Error[] = [];
  override log(info: WinstonInfo, next: () => void) {
    this.errors = extractErrorsStep(info);
    next();
  }
}

const telemetryHandler = {
  telemetry: { message: '' } as TelemetryData | undefined,
  handleTelemetry: (telemetry: TelemetryData) => {
    telemetryHandler.telemetry = telemetry;
  },
  clear() {
    this.telemetry = undefined;
  },
};

describe('Refactored AzureApplicationInsightsLogger', () => {
  beforeEach(() => {
    telemetryHandler.clear();
  });

  describe('Configuration', () => {
    describe('with sendErrorsAsExceptions set', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
        sendErrorsAsExceptions: true,
      });

      it('should send errors as exceptions', () => {
        const expected = new Error('test error');

        transport.log({ message: 'test message', level: 'info', [splatSymbol]: [expected] }, () => {});

        const result = telemetryHandler.telemetry;

        const actual = result?.errors[0];
        expect(actual).toBe(expected);
      });

      it('should filter errors from properties', () => {
        const expected = { userId: 123 };

        const error = new Error('test error');
        transport.log({ message: 'test message', level: 'info', [splatSymbol]: [expected, error] }, () => {});
        const result = telemetryHandler.telemetry;
        const actual = result?.properties;

        expect(actual).toEqual(expected);
      });

      it('should return empty object for empty splat', () => {
        transport.log({ message: 'test message', level: 'info', [splatSymbol]: [] }, () => {});

        const result = telemetryHandler.telemetry;
        const actual = result?.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });
    });
    describe('with sendErrorsAsExceptions unset', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
        sendErrorsAsExceptions: false,
      });

      it('should not send errors as exceptions', () => {
        transport.log({ message: 'test message', level: 'info', [splatSymbol]: [new Error('test error')] }, () => {});

        const result = telemetryHandler.telemetry;

        const actual = result?.errors[0];
        expect(actual).toBeUndefined();
      });

      it('should preserve errors in properties', () => {
        const data = { userId: 123 };
        const error = new Error('test error');
        const expected = [data, error];

        transport.log({ message: 'test message', level: 'info', [splatSymbol]: expected }, () => {});

        const result = telemetryHandler.telemetry;
        const actual = result?.properties;

        expect(actual).toEqual(expected);
      });

      it('should return empty object for empty splat', () => {
        transport.log({ message: 'test message', level: 'info', [splatSymbol]: [] }, () => {});

        const result = telemetryHandler.telemetry;
        const actual = result?.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });
    });
    describe('override severity mapping', () => {
      it('can pass override severity mapping', () => {
        const severityMapping: SeverityMapping = {};

        const action = () =>
          new RefactoredAzureApplicationInsightsTransport({
            telemetryHandler,
            severityMapping,
          });

        expect(action).not.toThrow();
      });

      it('can map silly to critical', () => {
        const severityMapping: SeverityMapping = {
          silly: TelemetrySeverity.Critical,
        };

        const transport = new RefactoredAzureApplicationInsightsTransport({
          telemetryHandler,
          severityMapping,
        });

        const logger = createLogger({
          level: 'silly',
          levels: config.npm.levels,
          transports: [transport],
        });
        logger.silly('critical message');

        const actual = telemetryHandler.telemetry?.severity;
        const expected = TelemetrySeverity.Critical;
        expect(actual).toBe(expected);
      });
    });
  });

  describe('Transport', () => {
    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler,
    });
    const logger = createLogger({
      transports: [transport],
    });

    it('should work as a winston transport', () => {
      const actual = () => logger.info('test message');

      expect(actual).not.toThrow();
    });

    it('test', () => {
      const expected = 'hello';
      logger.error(new Error(expected));

      const actual = telemetryHandler.telemetry?.message;
      expect(actual).toBe(expected);
    });

    it('should call telemetry handler when logging', () => {
      const expected = 'test message';

      transport.log({ level: 'info', message: expected }, () => {});

      const actual = telemetryHandler.telemetry?.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with just message', () => {
      const expected = 'just a message';

      logger.info(expected);

      const actual = telemetryHandler.telemetry?.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry?.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry?.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with just error', () => {
      const expected = 'something failed';

      const error = new Error(expected);
      logger.error(error);

      const actual = telemetryHandler.telemetry?.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with message property in object', () => {
      const expected = 'hello'; // NEW: expect cleaned message, not concatenated

      logger.info('hello', { message: 'world' });

      const actual = telemetryHandler.telemetry?.message;
      expect(actual).toBe(expected);
    });
  });

  describe('extractMessageStep', () => {
    it('should extract winston message in pipeline step', () => {
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

    it('should extract different messages', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'goodbye universe',
        [splatSymbol]: [{ message: 'universe' }],
      };

      const result = extractMessageStep(info);
      const actual = result.message;
      const expected = 'goodbye';

      expect(actual).toBe(expected);
    });

    it('should extract object message property', () => {
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

    it('should extract number message property', () => {
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

    it('should extract null message property', () => {
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

    it('should extract error', () => {
      const expected = 'Hello';
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
      });

      const logger = createLogger({
        transports: [transport],
      });

      const meta = new Error('World');
      logger.info(expected, meta);

      const winstonResult = telemetryHandler.telemetry!.message;

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

    it('should extract error objects from splat', () => {
      const expected = 'Error: 1';
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
      });

      const logger = createLogger({
        transports: [transport],
      });

      logger.error('Error: 1', new Error('2'), new Error('3'));

      const winstonResult = telemetryHandler.telemetry!.message; // This will be 'Error: 1 2'

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
      const expected = new Error('single error logged');
      logger.error(expected);

      const actual = transport.errors[0];

      expect(actual).toBe(expected);
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
        const actual = result.length;

        expect(actual).toBe(expected);
      });

      it('passes first error', () => {
        const expected = error1;

        const result = extractErrorsStep(info);
        const actual = result[0];

        expect(actual).toBe(expected);
      });

      it('passes second error', () => {
        const expected = error2;

        const result = extractErrorsStep(info);
        const actual = result[1];

        expect(actual).toBe(expected);
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
      const actual = result[0];

      expect(actual).toBe(error);
    });
  });

  describe('extractPropertiesStep', () => {
    it('should extract single property object directly', () => {
      const expected = { userId: 123, action: 'login' };

      const info: WinstonInfo = {
        level: 'info',
        message: 'User logged in',
        [splatSymbol]: [expected],
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
        [splatSymbol]: ['string', 42, properties1, error, null, properties2, true],
      };

      it('should return array with first object at correct index after filtering', () => {
        const result = extractPropertiesStep(info) as unknown[];
        const actual = result[2];
        const expected = { userId: 123 };
        // After filtering: ['string', 42, { userId: 123 }, null, { sessionId: 'abc' }, true]
        expect(actual).toEqual(expected);
      });

      it('should return array with second object at correct index after filtering', () => {
        const result = extractPropertiesStep(info) as unknown[];
        // After filtering errors: ['string', 42, { userId: 123 }, null, { sessionId: 'abc' }, true]
        const actual = result[4];
        const expected = { sessionId: 'abc' };
        expect(actual).toEqual(expected);
      });
    });

    it('should handle object with message property directly when single', () => {
      const expected = { message: 'world', userId: 123 };

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: [expected],
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
        [splatSymbol]: [error1, error2, expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
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
      const expected = { userId: 123, action: 'login' };
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
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
  });

  describe('Integration - Full Pipeline', () => {
    const propertiesTransport = new (class extends TransportStream {
      public properties: Record<string, unknown> | unknown[] = {};
      override log(info: WinstonInfo, next: () => void) {
        // Simulate the full pipeline
        const extractedInfo = extractMessageStep(info);
        this.properties = extractPropertiesStep(extractedInfo);
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
        const expected = { message: 'world', userId: 123 };
        logger.info('Action', expected);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Single Error', () => {
      it('should return empty properties when logging with single error', () => {
        logger.error('Error occurred', new Error('test error'));
        const actual = propertiesTransport.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Multiple Objects', () => {
      it('should return multiple objects as array', () => {
        const meta1 = { userId: 123 };
        const meta2 = { sessionId: 'abc' };
        const expected = [meta1, meta2];

        logger.info('Complex action', ...expected);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Multiple Primitives', () => {
      it('should return multiple primitives as array', () => {
        const expected = ['user123', 42, true];
        logger.info('Mixed primitives', ...expected);

        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Mixed Types (Objects + Primitives)', () => {
      it('should return all non-error items as array', () => {
        const expected = [{ userId: 123 }, 'session-abc', 42, { contextId: 'ctx-123' }];
        logger.info('Mixed types', ...expected);

        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Mixed Types Including Errors', () => {
      it('should extract only non-error items, ignoring errors (single object)', () => {
        const expected = { contextId: 'ctx-123' };

        logger.error('Error occurred', new Error('test error'), expected);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });

      it('should extract objects and primitives while ignoring errors (multiple items)', () => {
        const meta1 = { userId: 123 };
        const meta2 = { sessionId: 'abc' };
        const meta3 = 42;
        const expected = [meta1, meta2, meta3];
        logger.error('Complex error', new Error('error1'), meta1, meta2, new Error('error2'), meta3);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });
  });

  describe('Winston behavior with edge cases', () => {
    it('should map verbose level to Verbose severity', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({ telemetryHandler });

      transport.log({ level: 'verbose', message: 'test' }, () => {});

      expect(telemetryHandler.telemetry?.severity).toBe(TelemetrySeverity.Verbose);
    });

    it('should map silly level to Verbose severity', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({ telemetryHandler });

      transport.log({ level: 'silly', message: 'test' }, () => {});

      expect(telemetryHandler.telemetry?.severity).toBe(TelemetrySeverity.Verbose);
    });

    it('should handle npm-style levels with priority fallback', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
      };

      transport.log({ level: 'http', message: 'test' }, () => {});

      expect(telemetryHandler.telemetry?.severity).toBe(TelemetrySeverity.Verbose);
    });

    it('should handle mixed custom levels falling back to next mappable level', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        fatal: 0,
        error: 1,
        warn: 2,
        audit: 3,
        info: 4,
        trace: 5,
        debug: 6,
        silly: 7,
      };

      transport.log({ level: 'audit', message: 'test' }, () => {});

      expect(telemetryHandler.telemetry?.severity).toBe(TelemetrySeverity.Information);
    });

    it('should handle custom level between debug and info falling back to debug', () => {
      const transport = new RefactoredAzureApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        error: 0,
        warn: 1,
        info: 2,
        trace: 3,
        debug: 4,
        silly: 5,
      };

      transport.log({ level: 'trace', message: 'test' }, () => {});

      expect(telemetryHandler.telemetry?.severity).toBe(TelemetrySeverity.Verbose);
    });
  });
});
