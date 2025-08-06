import { TelemetryClient } from 'applicationinsightsv2';
import { type ExceptionTelemetry, SeverityLevel, type TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationInsightsV2TelemetryHandler } from '../src/ApplicationInsightsV2TelemetryHandler';
import { TelemetrySeverity } from '../src/enums';

describe('ApplicationInsightsV2TelemetryHandler', () => {
  const client = new SpyTelemetryClient();
  const handler = new ApplicationInsightsV2TelemetryHandler({ client });

  beforeEach(() => {
    client.clear();
  });

  it('can create handler with telemetry client', () => {
    const action = () => new ApplicationInsightsV2TelemetryHandler({ client });

    expect(action).not.toThrow();
  });

  it('can send trace telemetry', () => {
    handler.handleTelemetry({
      errors: [],
      message: 'hello world',
      properties: {},
      severity: TelemetrySeverity.Information,
    });

    const actual = client.traces;
    const expected = 1;
    expect(actual).toHaveLength(expected);
  });

  it('should pass message to trace telemetry', () => {
    const expected = 'test message';

    handler.handleTelemetry({
      errors: [],
      message: expected,
      properties: {},
      severity: TelemetrySeverity.Information,
    });

    const actual = client.traces[0]?.message;
    expect(actual).toBe(expected);
  });

  it('should map error severity to SeverityLevel.Error', () => {
    handler.handleTelemetry({
      errors: [],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Error,
    });

    const actual = client.traces[0]?.severity;
    const expected = SeverityLevel.Error;
    expect(actual).toBe(expected);
  });

  it('should pass properties to trace telemetry', () => {
    const expected = { userId: 123, action: 'login' };

    handler.handleTelemetry({
      errors: [],
      message: 'test',
      properties: expected,
      severity: TelemetrySeverity.Information,
    });

    const actual = client.traces[0]?.properties;
    expect(actual).toBe(expected);
  });

  it('should map warning severity to SeverityLevel.Warning', () => {
    handler.handleTelemetry({
      errors: [],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Warning,
    });

    const actual = client.traces[0]?.severity;
    const expected = SeverityLevel.Warning;
    expect(actual).toBe(expected);
  });

  it('should map critical severity to SeverityLevel.Critical', () => {
    handler.handleTelemetry({
      errors: [],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Critical,
    });

    const actual = client.traces[0]?.severity;
    const expected = SeverityLevel.Critical;
    expect(actual).toBe(expected);
  });

  it('should map verbose severity to SeverityLevel.Verbose', () => {
    handler.handleTelemetry({
      errors: [],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Verbose,
    });

    const actual = client.traces[0]?.severity;
    const expected = SeverityLevel.Verbose;
    expect(actual).toBe(expected);
  });

  it('should track exceptions when errors are present', () => {
    const error = new Error('test error');

    handler.handleTelemetry({
      errors: [error],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Error,
    });

    const actual = client.exceptions.length;
    const expected = 1;
    expect(actual).toBe(expected);
  });

  it('should track multiple exceptions for multiple errors', () => {
    const error1 = new Error('first error');
    const error2 = new Error('second error');

    handler.handleTelemetry({
      errors: [error1, error2],
      message: 'test',
      properties: {},
      severity: TelemetrySeverity.Error,
    });

    const actual = client.exceptions.length;
    const expected = 2;
    expect(actual).toBe(expected);
  });
});

class SpyTelemetryClient extends TelemetryClient {
  public constructor() {
    super('InstrumentationKey=00000000-0000-0000-0000-000000000000');
  }
  public traces: TraceTelemetry[] = [];
  public exceptions: ExceptionTelemetry[] = [];

  public clear() {
    this.traces.length = 0;
    this.exceptions.length = 0;
  }

  override trackTrace(telemetry: TraceTelemetry): void {
    this.traces.push(telemetry);
  }

  override trackException(telemetry: ExceptionTelemetry): void {
    this.exceptions.push(telemetry);
  }
}
