import { type ExceptionTelemetry, KnownSeverityLevel, TelemetryClient, type TraceTelemetry } from 'applicationinsightsv3';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationInsightsV3TelemetryHandler } from '../src/ApplicationInsightsV3TelemetryHandler';
import { TelemetrySeverity } from '../src/enums';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

describe('ApplicationInsightsV3TelemetryHandler', () => {
  const client = new SpyTelemetryClientV3();
  const handler = new ApplicationInsightsV3TelemetryHandler({ client });

  it('can create handler with telemetry client', () => {
    const action = () => new ApplicationInsightsV3TelemetryHandler({ client });

    expect(action).not.toThrow();
  });

  it('can send trace telemetry', () => {
    handler.handleTelemetry({
      trace: {
        message: 'hello world',
        properties: {},
        severity: TelemetrySeverity.Information,
      },
      errors: [],
    });

    const actual = client.traces;
    const expected = 1;
    expect(actual).toHaveLength(expected);
  });

  it('should pass message to trace telemetry', () => {
    const expected = 'test message';

    handler.handleTelemetry({
      errors: [],
      trace: {
        message: expected,
        properties: {},
        severity: TelemetrySeverity.Information,
      },
    });

    const actual = client.traces[0]?.message;
    expect(actual).toBe(expected);
  });

  it('should map error severity to Error', () => {
    handler.handleTelemetry({
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
      errors: [],
    });

    const actual = client.traces[0]?.severity;
    const expected = KnownSeverityLevel.Error;
    expect(actual).toBe(expected);
  });

  it('should pass properties to trace telemetry', () => {
    const expected = { userId: 123, action: 'login' };

    handler.handleTelemetry({
      errors: [],
      trace: {
        message: 'test',
        properties: expected,
        severity: TelemetrySeverity.Information,
      },
    });

    const actual = client.traces[0]?.properties;
    expect(actual).toBe(expected);
  });

  it('should map warning severity to Warning', () => {
    handler.handleTelemetry({
      errors: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Warning,
      },
    });

    const actual = client.traces[0]?.severity;
    const expected = KnownSeverityLevel.Warning;
    expect(actual).toBe(expected);
  });

  it('should map critical severity to Critical', () => {
    handler.handleTelemetry({
      errors: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Critical,
      },
    });

    const actual = client.traces[0]?.severity;
    const expected = KnownSeverityLevel.Critical;
    expect(actual).toBe(expected);
  });

  it('should map verbose severity to Verbose', () => {
    handler.handleTelemetry({
      errors: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Verbose,
      },
    });

    const actual = client.traces[0]?.severity;
    const expected = KnownSeverityLevel.Verbose;
    expect(actual).toBe(expected);
  });

  it('should track exceptions when errors are present', () => {
    const error = new Error('test error');

    handler.handleTelemetry({
      errors: [error],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
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
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
    });

    const actual = client.exceptions.length;
    const expected = 2;
    expect(actual).toBe(expected);
  });

  it('should not send trace when trace filter returns false', () => {
    const client = new SpyTelemetryClientV3();
    const handler = new ApplicationInsightsV3TelemetryHandler({
      client,
      traceFilter: () => false,
    });

    handler.handleTelemetry({
      errors: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Information,
      },
    });

    const actual = client.traces.length;
    const expected = 0;
    expect(actual).toBe(expected);
  });

  it('sends trace telemetry with correct trace data', () => {
    const expected = 'this is the message';

    handler.handleTelemetry({
      trace: {
        message: expected,
        properties: {},
        severity: TelemetrySeverity.Information,
      },
      errors: [],
    });
  });

  it('should not send exception when exception filter returns false', () => {
    const client = new SpyTelemetryClientV3();
    const handler = new ApplicationInsightsV3TelemetryHandler({
      client,
      exceptionFilter: () => false,
    });

    const error = new Error('test error');
    handler.handleTelemetry({
      errors: [error],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
    });

    const actual = client.exceptions.length;
    const expected = 0;
    expect(actual).toBe(expected);
  });

  it('should pass correct exception telemetry to exception filter', () => {
    const client = new SpyTelemetryClientV3();
    let capturedExceptionTelemetry: ExceptionTelemetry | undefined;

    const handler = new ApplicationInsightsV3TelemetryHandler({
      client,
      exceptionFilter: (exception) => {
        capturedExceptionTelemetry = exception;
        return true;
      },
    });

    const error = new Error('test error');
    handler.handleTelemetry({
      errors: [error],
      trace: {
        message: 'test message',
        properties: { userId: 123 },
        severity: TelemetrySeverity.Error,
      },
    });

    const actual = capturedExceptionTelemetry?.exception;
    expect(actual).toBe(error);
  });
});
