import { describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('defaultMeta support', () => {
  const telemetryHandler = new SpyTelemetryHandler();

  describe('Object defaultMeta behavior', () => {
    it('should include defaultMeta in properties when no splat', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = { userId: 123, appVersion: '1.0.0' };

      expect(actual).toEqual(expected);
    });

    it('should merge defaultMeta with single object splat', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      logger.info('test message', { sessionId: 'abc-123' });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        userId: 123,
        appVersion: '1.0.0',
        sessionId: 'abc-123',
      };

      expect(actual).toEqual(expected);
    });

    it('should let splat override defaultMeta properties', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      logger.info('test message', { userId: 456, extra: 'data' });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        userId: 456, // Splat overrides defaultMeta
        appVersion: '1.0.0', // defaultMeta preserved
        extra: 'data', // New from splat
      };

      expect(actual).toEqual(expected);
    });

    it('should return defaultMeta when all splat items are errors', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      logger.info('test message', new Error('error1'), new Error('error2'));

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = { userId: 123, appVersion: '1.0.0' }; // Should still get defaultMeta

      expect(actual).toEqual(expected);
    });

    it('should return defaultMeta when first splat is primitive (Winston behavior)', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      logger.info('test message', 'string-data', { sessionId: 'abc' });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      // Winston ignores primitive first splat, only uses defaultMeta
      const expected = { userId: 123, appVersion: '1.0.0' };

      expect(actual).toEqual(expected);
    });

    it('should merge defaultMeta with first object when multiple splat items', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: { userId: 123, appVersion: '1.0.0' },
        transports: [transport],
      });

      // Multiple objects - Winston only merges the first one
      logger.info('test message', { sessionId: 'abc' }, { requestId: 'req-123' });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        userId: 123,
        appVersion: '1.0.0',
        sessionId: 'abc', // Only first object merged, requestId ignored
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('Array defaultMeta behavior', () => {
    it('should spread array defaultMeta as indexed properties', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: [1, 2, 3],
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      // Winston spreads array as indexed properties
      const expected = { '0': 1, '1': 2, '2': 3 };

      expect(actual).toEqual(expected);
    });

    it('should merge array defaultMeta with object splat', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: [1, 2, 3],
        transports: [transport],
      });

      logger.info('test message', { userId: 123 });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        '0': 1,
        '1': 2,
        '2': 3, // From array defaultMeta
        userId: 123, // From splat
      };

      expect(actual).toEqual(expected);
    });

    it('should merge array defaultMeta with array splat', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: [10, 20],
        transports: [transport],
      });

      logger.info('test message', [30, 40]);

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        '0': 30,
        '1': 40, // Splat array overrides defaultMeta indices
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('String defaultMeta behavior', () => {
    it('should spread string defaultMeta as character properties', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: 'app',
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      // Winston spreads string as character properties
      const expected = { '0': 'a', '1': 'p', '2': 'p' };

      expect(actual).toEqual(expected);
    });

    it('should merge string defaultMeta with object splat', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: 'app',
        transports: [transport],
      });

      logger.info('test message', { userId: 123 });

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {
        '0': 'a',
        '1': 'p',
        '2': 'p', // From string defaultMeta
        userId: 123, // From splat
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('Primitive defaultMeta behavior', () => {
    it('should ignore number defaultMeta', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: 42,
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      // Winston ignores primitive defaultMeta
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should ignore boolean defaultMeta', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: true,
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {};

      expect(actual).toEqual(expected);
    });

    it('should ignore null defaultMeta', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      const logger = createLogger({
        defaultMeta: null,
        transports: [transport],
      });

      logger.info('test message');

      const actual = telemetryHandler.telemetry?.trace?.properties;
      const expected = {};

      expect(actual).toEqual(expected);
    });
  });
});
