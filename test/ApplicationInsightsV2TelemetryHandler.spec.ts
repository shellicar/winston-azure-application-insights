import { TelemetryClient } from 'applicationinsightsv2';
import { type ExceptionTelemetry, SeverityLevel, type TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationInsightsV2TelemetryHandler } from '../src/ApplicationInsightsV2TelemetryHandler';
import { TelemetrySeverity } from '../src/enums';
import { SpyTelemetryClientV2 } from './spies/SpyTelemetryClientV2';

describe('ApplicationInsightsV2TelemetryHandler', () => {
  const client = new SpyTelemetryClientV2();
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
      trace: {
        message: 'hello world',
        properties: {},
        severity: TelemetrySeverity.Information,
      },
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
      errors: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
    });

    const actual = client.traces[0]?.severity;
    const expected = SeverityLevel.Error;
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
    const expected = SeverityLevel.Warning;
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
    const expected = SeverityLevel.Critical;
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
    const expected = SeverityLevel.Verbose;
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
});

it('should not send trace when trace filter returns false', () => {
  const client = new SpyTelemetryClientV2();
  const handler = new ApplicationInsightsV2TelemetryHandler({
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

it('should pass correct trace telemetry to trace filter', () => {
  const client = new SpyTelemetryClientV2();
  let capturedTraceTelemetry: TraceTelemetry | undefined;

  const handler = new ApplicationInsightsV2TelemetryHandler({
    client,
    traceFilter: (trace) => {
      capturedTraceTelemetry = trace;
      return true;
    },
  });

  handler.handleTelemetry({
    errors: [],
    trace: {
      message: 'test message',
      properties: { userId: 123 },
      severity: TelemetrySeverity.Information,
    },
  });

  const actual = capturedTraceTelemetry?.message;
  const expected = 'test message';
  expect(actual).toBe(expected);
});

it('should not send exception when exception filter returns false', () => {
  const client = new SpyTelemetryClientV2();
  const handler = new ApplicationInsightsV2TelemetryHandler({
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
  const client = new SpyTelemetryClientV2();
  let capturedExceptionTelemetry: ExceptionTelemetry | undefined;

  const handler = new ApplicationInsightsV2TelemetryHandler({
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
