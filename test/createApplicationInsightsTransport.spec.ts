import { describe, expect, it } from 'vitest';
import { ApplicationInsightsTransport } from '../src/private/ApplicationInsightsTransport';
import { createApplicationInsightsTransport } from '../src/public/createApplicationInsightsTransport';
import { ApplicationInsightsVersion, TelemetrySeverity } from '../src/public/enums';
import { SpyTelemetryClientV2 } from './spies/SpyTelemetryClientV2';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

describe('createApplicationInsightsTransport', () => {
  it('should create an ApplicationInsightsTransport instance', () => {
    const client = new SpyTelemetryClientV3();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
    });

    expect(transport).toBeInstanceOf(ApplicationInsightsTransport);
  });

  it('should create transport that works with V2 client', () => {
    const client = new SpyTelemetryClientV2();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V2,
      client,
    });

    transport.log?.({ level: 'info', message: 'Test V2' }, () => {});

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test V2');
  });

  it('should create transport that works with V3 client', () => {
    const client = new SpyTelemetryClientV3();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
    });

    transport.log?.({ level: 'info', message: 'Test V3' }, () => {});

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test V3');
  });

  it('should pass through custom severity mapping', () => {
    const client = new SpyTelemetryClientV3();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
      severityMapping: {
        custom: TelemetrySeverity.Critical,
      },
    });

    transport.log?.({ level: 'custom', message: 'Custom level' }, () => {});

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.severity).toBe('Critical');
  });

  it('should pass through trace filter', () => {
    const client = new SpyTelemetryClientV3();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
      traceFilter: (trace) => trace.message !== 'filtered',
    });

    transport.log?.({ level: 'info', message: 'allowed' }, () => {});
    transport.log?.({ level: 'info', message: 'filtered' }, () => {});

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('allowed');
  });

  it('should pass through exception filter', () => {
    const client = new SpyTelemetryClientV3();
    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
      exceptionFilter: (exception) => exception.exception.message !== 'filtered error',
    });

    const allowedError = new Error('allowed error');
    const filteredError = new Error('filtered error');

    transport.log?.({ level: 'error', message: 'Test', [Symbol.for('splat')]: [allowedError] }, () => {});
    transport.log?.({ level: 'error', message: 'Test', [Symbol.for('splat')]: [filteredError] }, () => {});

    expect(client.exceptions).toHaveLength(1);
    expect(client.exceptions[0]?.exception).toBe(allowedError);
  });

  it('should pass through custom isError function', () => {
    const client = new SpyTelemetryClientV3();

    class CustomError extends Error {}

    const transport = createApplicationInsightsTransport({
      version: ApplicationInsightsVersion.V3,
      client,
      isError: (obj): obj is Error => obj instanceof CustomError,
    });

    const customError = new CustomError('Custom error type');
    const regularError = new Error('Regular error');

    transport.log?.({ level: 'error', message: 'Test custom', [Symbol.for('splat')]: [customError] }, () => {});
    transport.log?.({ level: 'error', message: 'Test regular', [Symbol.for('splat')]: [regularError] }, () => {});

    // Should only extract the CustomError as an exception, not the regular Error
    expect(client.exceptions).toHaveLength(1);
    expect(client.exceptions[0]?.exception).toBe(customError);
  });
});
