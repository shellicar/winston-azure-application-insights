import { describe, expect, it } from 'vitest';
import { ApplicationInsightsV2TelemetryHandler } from '../src/private/ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from '../src/private/ApplicationInsightsV3TelemetryHandler';
import { createTelemetryHandler } from '../src/public/createTelemetryHandler';
import { ApplicationInsightsVersion, TelemetrySeverity } from '../src/public/enums';
import type { TelemetryHandler } from '../src/public/types';
import { SpyTelemetryClientV2 } from './spies/SpyTelemetryClientV2';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

describe('createTelemetryHandler', () => {
  it('should create V2 telemetry handler', () => {
    const client = new SpyTelemetryClientV2();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V2, client });

    expect(handler).toBeInstanceOf(ApplicationInsightsV2TelemetryHandler);
  });

  it('should create V3 telemetry handler', () => {
    const client = new SpyTelemetryClientV3();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V3, client });

    expect(handler).toBeInstanceOf(ApplicationInsightsV3TelemetryHandler);
  });

  it('should create V2 handler that can handle telemetry', () => {
    const client = new SpyTelemetryClientV2();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V2, client });

    handler.handleTelemetry({
      trace: {
        message: 'Test V2 trace',
        properties: { userId: 123 },
        severity: TelemetrySeverity.Information,
      },
      exceptions: [],
    });

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test V2 trace');
    expect(client.traces[0]?.properties).toEqual({ userId: 123 });
  });

  it('should create V3 handler that can handle telemetry', () => {
    const client = new SpyTelemetryClientV3();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V3, client });

    handler.handleTelemetry({
      trace: {
        message: 'Test V3 trace',
        properties: { userId: 456 },
        severity: TelemetrySeverity.Warning,
      },
      exceptions: [],
    });

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test V3 trace');
    expect(client.traces[0]?.properties).toEqual({ userId: 456 });
    expect(client.traces[0]?.severity).toBe('Warning');
  });

  it('should create V2 handler that can handle exceptions', () => {
    const client = new SpyTelemetryClientV2();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V2, client });
    const testError = new Error('Test V2 exception');

    handler.handleTelemetry({
      trace: null,
      exceptions: [
        {
          exception: testError,
          properties: { context: 'test' },
        },
      ],
    });

    expect(client.exceptions).toHaveLength(1);
    expect(client.exceptions[0]?.exception).toBe(testError);
    expect(client.exceptions[0]?.properties).toEqual({ context: 'test' });
  });

  it('should create V3 handler that can handle exceptions', () => {
    const client = new SpyTelemetryClientV3();
    const handler = createTelemetryHandler({ version: ApplicationInsightsVersion.V3, client });
    const testError = new Error('Test V3 exception');

    handler.handleTelemetry({
      trace: null,
      exceptions: [
        {
          exception: testError,
          properties: { context: 'test' },
        },
      ],
    });

    expect(client.exceptions).toHaveLength(1);
    expect(client.exceptions[0]?.exception).toBe(testError);
    expect(client.exceptions[0]?.properties).toEqual({ context: 'test' });
  });

  it('returns provided handler when handler is passed', () => {
    const mockHandler: TelemetryHandler = {
      handleTelemetry: () => {},
    };

    const result = createTelemetryHandler({ telemetryHandler: mockHandler });

    expect(result).toBe(mockHandler);
  });
});
