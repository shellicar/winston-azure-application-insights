import { beforeEach, describe, expect, it } from 'vitest';
import { config, createLogger } from 'winston';
import TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import { splatSymbol } from '../src/consts';
import { TelemetrySeverity } from '../src/enums';
import { extractMessageStep } from '../src/extractMessageStep';
import { extractPropertiesStep } from '../src/extractPropertiesStep';
import type { SeverityMapping } from '../src/types';
import type { WinstonInfo } from '../src/types';
import type { TelemetryData } from '../src/types';

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
      const transport = new ApplicationInsightsTransport({
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
      const transport = new ApplicationInsightsTransport({
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
          new ApplicationInsightsTransport({
            telemetryHandler,
            severityMapping,
          });

        expect(action).not.toThrow();
      });

      it('can map silly to critical', () => {
        const severityMapping: SeverityMapping = {
          silly: TelemetrySeverity.Critical,
        };

        const transport = new ApplicationInsightsTransport({
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
    const transport = new ApplicationInsightsTransport({
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

  describe('Integration - Full Pipeline', () => {
    const propertiesTransport = new (class extends TransportStream {
      public properties: Record<string, unknown> | unknown[] = {};
      override log(info: WinstonInfo, next: () => void) {
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

        const actual = propertiesTransport.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Single Primitive', () => {
      it('should extract single string as array', () => {
        logger.info('Single primitive', 'important-value');

        const actual = propertiesTransport.properties;
        const expected = ['important-value'];

        expect(actual).toEqual(expected);
      });

      it('should extract single number as array', () => {
        logger.info('Single number', 42);

        const actual = propertiesTransport.properties;
        const expected = [42];

        expect(actual).toEqual(expected);
      });

      it('should extract single boolean as array', () => {
        logger.info('Single boolean', true);

        const actual = propertiesTransport.properties;
        const expected = [true];

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Single Object', () => {
      it('should extract single object properties directly', () => {
        logger.info('User action', { userId: 123, action: 'login' });

        const actual = propertiesTransport.properties;
        const expected = {
          userId: 123,
          action: 'login',
        };

        expect(actual).toEqual(expected);
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
      const transport = new ApplicationInsightsTransport({ telemetryHandler });

      transport.log({ level: 'verbose', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should map silly level to Verbose severity', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });

      transport.log({ level: 'silly', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should handle npm-style levels with priority fallback', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
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

      const actual = telemetryHandler.telemetry?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should handle mixed custom levels falling back to next mappable level', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        fatal: 0,
        error: 1,
        warn: 2,
        audit: 3,
        info: 4,
        custom: 5,
        debug: 6,
        silly: 7,
      };

      transport.log({ level: 'audit', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.severity;
      const expected = TelemetrySeverity.Information;

      expect(actual).toBe(expected);
    });

    it('should handle custom level between debug and info falling back to debug', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        error: 0,
        warn: 1,
        info: 2,
        custom: 3,
        debug: 4,
        silly: 5,
      };

      transport.log({ level: 'custom', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });
  });
});
