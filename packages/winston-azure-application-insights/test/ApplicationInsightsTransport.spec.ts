import { SPLAT } from 'triple-beam';
import { beforeEach, describe, expect, it } from 'vitest';
import { config, createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/private/ApplicationInsightsTransport';
import { TelemetrySeverity } from '../src/public/enums';
import type { ITraceTelemetryFilter, SeverityMapping, TelemetryDataException, TelemetryDataTrace } from '../src/public/types';
import { SpyPropertiesTransport } from './spies/SpyPropertiesTransport';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('Refactored AzureApplicationInsightsLogger', () => {
  const telemetryHandler = new SpyTelemetryHandler();

  describe('Configuration', () => {
    describe('Error handling behaviour', () => {
      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
      });

      it('should send errors as exceptions', () => {
        const err = new Error('test error');

        transport.log({ message: 'test message', level: 'info', [SPLAT]: [err] }, () => {});

        const result = telemetryHandler.telemetry;

        const actual = result?.exceptions[0];
        const expected = {
          exception: err,
          properties: {},
        } satisfies TelemetryDataException;

        expect(actual).toEqual(expected);
      });

      it('should filter errors from properties', () => {
        const expected = { userId: 123 };

        const error = new Error('test error');
        transport.log({ message: 'test message', level: 'info', [SPLAT]: [expected, error] }, () => {});
        const result = telemetryHandler.telemetry;
        const actual = result?.trace?.properties;

        expect(actual).toEqual(expected);
      });

      it('should return empty object for empty splat', () => {
        transport.log({ message: 'test message', level: 'info', [SPLAT]: [] }, () => {});

        const result = telemetryHandler.telemetry;
        const actual = result?.trace?.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });

      describe('Error as first parameter', () => {
        it('should extract error when Error passed as first parameter', () => {
          const err = new Error('Database error');
          const logger = createLogger({ transports: [transport] });

          logger.error(err);

          const actual = telemetryHandler.telemetry?.exceptions[0];
          const expected = {
            exception: err,
            properties: {},
          } satisfies TelemetryDataException;

          expect(actual).toEqual(expected);
        });

        it('should have empty properties when Error passed as first parameter', () => {
          const logger = createLogger({ transports: [transport] });

          logger.error(new Error('UNIQUE_NEW_TRANSPORT_ERROR_12345'));

          const actual = telemetryHandler.telemetry?.trace;
          expect(actual).toBeNull();
        });

        it('should send no trace when Error passed as first parameter', () => {
          const logger = createLogger({ transports: [transport] });

          logger.error(new Error('hello world'));

          const actual = telemetryHandler.telemetry?.trace;
          expect(actual).toBeNull();
        });

        it('should use error message when Error passed as first parameter', () => {
          const logger = createLogger({ transports: [transport] });

          logger.error(new Error('Database error'));

          const actual = telemetryHandler.telemetry?.trace;
          expect(actual).toBeNull();
        });
      });
    });

    describe('override severity mapping', () => {
      it('should allow override severity mapping', () => {
        const severityMapping: SeverityMapping = {};

        const action = () =>
          new ApplicationInsightsTransport({
            telemetryHandler,
            severityMapping,
          });

        expect(action).not.toThrow();
      });

      it('should map silly to critical', () => {
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

        const actual = telemetryHandler.telemetry?.trace?.severity;
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

    it('should successfully initialize and accept log calls without throwing', () => {
      const actual = () => logger.info('test message');

      expect(actual).not.toThrow();
    });

    it('should call telemetry handler when logging', () => {
      const expected = 'test message';

      transport.log({ level: 'info', message: expected }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with just message', () => {
      const expected = 'just a message';

      logger.info(expected);

      const actual = telemetryHandler.telemetry?.trace?.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry?.trace?.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with just error', () => {
      const expected = 'something failed';

      const error = new Error(expected);
      logger.error(error);

      const actual = telemetryHandler.telemetry?.trace;
      expect(actual).toBeNull();
    });

    it('should receive winston info with message property in object', () => {
      const expected = 'hello';

      logger.info('hello', { message: 'world' });

      const actual = telemetryHandler.telemetry?.trace?.message;
      expect(actual).toBe(expected);
    });
  });

  describe('Filtering', () => {
    it('should not send trace when trace filter returns false', () => {
      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
        traceFilter: () => false,
      });

      transport.log(
        {
          level: 'info',
          message: 'test message',
        },
        () => {},
      );

      const actual = telemetryHandler.telemetry?.trace;
      const expected = null;
      expect(actual).toBe(expected);
    });

    it('should pass correct trace telemetry to trace filter', () => {
      let capturedTraceTelemetry: TelemetryDataTrace | undefined;
      const traceFilter: ITraceTelemetryFilter = (trace) => {
        capturedTraceTelemetry = trace;
        return true;
      };

      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
        traceFilter,
      });

      transport.log(
        {
          level: 'info',
          message: 'test message',
        },
        () => {},
      );

      const actual = telemetryHandler.telemetry?.trace;
      const expected = {
        message: 'test message',
        properties: {},
        severity: TelemetrySeverity.Information,
      } satisfies TelemetryDataTrace;
      expect(actual).toEqual(expected);
    });

    it('should not send exception when exception filter returns false', () => {
      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
        exceptionFilter: () => false,
      });

      const error = new Error('test error');

      transport.log(
        {
          level: 'info',
          message: 'test message',
          [SPLAT]: [error],
        },
        () => {},
      );

      const actual = telemetryHandler.telemetry?.exceptions[0];
      expect(actual).toBeUndefined();
    });

    it('should pass correct exception telemetry to exception filter', () => {
      let capturedExceptionTelemetry: TelemetryDataException | undefined;

      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
        exceptionFilter: (telemetry) => {
          capturedExceptionTelemetry = telemetry;
          return true;
        },
      });

      const error = new Error('test error');

      transport.log(
        {
          level: 'info',
          message: 'test message',
          [SPLAT]: [error],
        },
        () => {},
      );

      const actual = capturedExceptionTelemetry?.exception;
      expect(actual).toBe(error);
    });
  });

  describe('Integration - Full Pipeline', () => {
    const propertiesTransport = new SpyPropertiesTransport();

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
      it('should ignore single string primitive (Winston behaviour)', () => {
        logger.info('Single primitive', 'important-value');

        const actual = propertiesTransport.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });

      it('should ignore single number primitive (Winston behaviour)', () => {
        logger.info('Single number', 42);

        const actual = propertiesTransport.properties;
        const expected = {};

        expect(actual).toEqual(expected);
      });

      it('should ignore single boolean primitive (Winston behaviour)', () => {
        logger.info('Single boolean', true);

        const actual = propertiesTransport.properties;
        const expected = {};

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
      it('should merge defaultMeta with first object only (Winston behaviour)', () => {
        const meta1 = { userId: 123 };
        const meta2 = { sessionId: 'abc' };
        const expected = meta1;

        logger.info('Complex action', meta1, meta2);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Multiple Primitives', () => {
      it('should ignore multiple primitives (Winston behaviour)', () => {
        const expected = {};

        logger.info('Multiple primitives', 'user123', 42, true);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });

    describe('Message + Mixed Types (Objects + Primitives)', () => {
      it('should return first object only (Winston behaviour)', () => {
        const expected = { userId: 123 };
        logger.info('Mixed types', { userId: 123 }, 'session-abc', 42, { contextId: 'ctx-123' });

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
        const expected = meta1;
        logger.error('Complex error', new Error('error1'), meta1, meta2, new Error('error2'), meta3);
        const actual = propertiesTransport.properties;

        expect(actual).toEqual(expected);
      });
    });
  });
});
