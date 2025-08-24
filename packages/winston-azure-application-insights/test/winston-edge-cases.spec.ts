import { describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/private/ApplicationInsightsTransport';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('ApplicationInsightsTransport edge case handling', () => {
  it('should convert number message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error(42);

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = '42';
    expect(actual).toBe(expected);
  });

  it('should convert null message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error(null);

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = 'null';
    expect(actual).toBe(expected);
  });

  it('should convert undefined message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error(undefined);

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = 'undefined';
    expect(actual).toBe(expected);
  });

  it('should convert object message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error({ foo: 'bar', baz: 123 });

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = '[object Object]';
    expect(actual).toBe(expected);
  });

  it('should convert array message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error([1, 2, 3]);

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = '1,2,3';
    expect(actual).toBe(expected);
  });

  it('should convert boolean message to string in trace telemetry', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({ transports: [transport] });

    logger.error(true);

    const actual = telemetryHandler.telemetry?.trace?.message;
    const expected = 'true';
    expect(actual).toBe(expected);
  });
});
