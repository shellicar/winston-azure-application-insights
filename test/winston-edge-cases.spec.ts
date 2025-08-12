import { SPLAT } from 'triple-beam';
import { describe, it } from 'vitest';
import { createLogger } from 'winston';
import TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import type { WinstonInfo } from '../src/types';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

class DebugTransport extends TransportStream {
  override log(info: WinstonInfo, next: () => void) {
    console.log('=== WINSTON DEBUG ===');
    console.log('Raw info:', info);
    console.log('Info.message:', info.message);
    console.log('Info.message type:', typeof info.message);
    console.log('Info instanceof Error:', info instanceof Error);
    console.log('Info[SPLAT]:', info[SPLAT]);
    console.log('Info keys:', Object.keys(info));
    console.log('=====================');
    next();
  }
}

describe('Winston edge case behavior investigation', () => {
  const telemetryHandler = new SpyTelemetryHandler();
  const transport = new ApplicationInsightsTransport({ telemetryHandler });
  const debugTransport = new DebugTransport();
  const logger = createLogger({ transports: [transport, debugTransport] });

  it('should show what happens with number as first param', () => {
    logger.error(42);
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });

  it('should show what happens with null as first param', () => {
    logger.error(null);
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });

  it('should show what happens with undefined as first param', () => {
    logger.error(undefined);
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });

  it('should show what happens with object as first param', () => {
    logger.error({ foo: 'bar', baz: 123 });
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });

  it('should show what happens with array as first param', () => {
    logger.error([1, 2, 3]);
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });

  it('should show what happens with boolean as first param', () => {
    logger.error(true);
    console.log('Our transport result:', telemetryHandler.telemetry);
    console.log('Trace message:', telemetryHandler.telemetry?.trace?.message);
    console.log('Trace message type:', typeof telemetryHandler.telemetry?.trace?.message);
  });
});
