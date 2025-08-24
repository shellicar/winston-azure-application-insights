import { KnownSeverityLevel } from 'applicationinsightsv3';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplicationInsightsV3TelemetryHandler } from '../src/private/ApplicationInsightsV3TelemetryHandler';
import { TelemetrySeverity } from '../src/public/enums';
import type { TelemetryDataException } from '../src/public/types';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

describe('ApplicationInsightsV3TelemetryHandler', () => {
  const client = new SpyTelemetryClientV3();
  const handler = new ApplicationInsightsV3TelemetryHandler({ client });

  beforeEach(() => {
    client.clear();
  });

  it('can create handler with telemetry client', () => {
    const action = () => new ApplicationInsightsV3TelemetryHandler({ client });

    expect(action).not.toThrow();
  });

  it('can send trace telemetry', () => {
    handler.handleTelemetry({
      exceptions: [],
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
      exceptions: [],
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
      exceptions: [],
      trace: {
        message: 'test',
        properties: {},
        severity: TelemetrySeverity.Error,
      },
    });

    const actual = client.traces[0]?.severity;
    const expected = KnownSeverityLevel.Error;
    expect(actual).toBe(expected);
  });

  it('should pass properties to trace telemetry', () => {
    const expected = { userId: 123, action: 'login' };

    handler.handleTelemetry({
      exceptions: [],
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
      exceptions: [],
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
      exceptions: [],
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
      exceptions: [],
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
      exceptions: [{ exception: error, properties: {} }],
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
      exceptions: [
        { exception: error1, properties: {} },
        { exception: error2, properties: {} },
      ],
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

  describe('Exception properties extraction', () => {
    it('should include custom Error properties with exception telemetry', () => {
      class CustomError extends Error {
        public readonly errorCode: string;
        public readonly metadata: Record<string, unknown>;

        constructor(message: string, errorCode: string, metadata: Record<string, unknown>) {
          super(message);
          this.name = 'CustomError';
          this.errorCode = errorCode;
          this.metadata = metadata;
        }
      }

      const customError = new CustomError('Something failed', 'E001', { userId: 123, operation: 'checkout' });

      handler.handleTelemetry({
        trace: null,
        exceptions: [{ exception: customError, properties: { errorCode: 'E001', metadata: { userId: 123, operation: 'checkout' } } }],
      });

      expect(client.exceptions).toHaveLength(1);
      expect(client.exceptions[0]).toEqual({
        exception: customError,
        properties: {
          errorCode: 'E001',
          metadata: { userId: 123, operation: 'checkout' },
        },
      });
    });

    it('should exclude standard Error properties from exception properties', () => {
      class ExtendedError extends Error {
        public readonly customProp: string;

        constructor(message: string, customProp: string) {
          super(message);
          this.name = 'ExtendedError';
          this.customProp = customProp;
        }
      }

      const error = new ExtendedError('Test error', 'custom-value');

      handler.handleTelemetry({
        trace: null,
        exceptions: [{ exception: error, properties: { customProp: 'custom-value' } }],
      });

      expect(client.exceptions).toHaveLength(1);
      const actual = client.exceptions[0];
      const expected = {
        exception: error,
        properties: {
          customProp: 'custom-value',
        },
      } satisfies TelemetryDataException;

      expect(actual).toEqual(expected);
    });

    it('should handle Error objects with Object.create(null) properties', () => {
      const extensions = Object.create(null);
      extensions.code = 'GRAPHQL_ERROR';
      extensions.field = 'userInput';

      class GraphQLError extends Error {
        public readonly extensions: Record<string, unknown>;

        constructor(message: string, extensions: Record<string, unknown>) {
          super(message);
          this.name = 'GraphQLError';
          this.extensions = extensions;
        }
      }

      const graphqlError = new GraphQLError('Validation failed', extensions);

      handler.handleTelemetry({
        trace: null,
        exceptions: [{ exception: graphqlError, properties: { extensions } }],
      });

      const actual = client.exceptions[0];
      const expected = {
        exception: graphqlError,
        properties: {
          extensions,
        },
      } satisfies TelemetryDataException;

      expect(actual).toEqual(expected);
    });

    it('should send empty properties object when Error has no custom properties', () => {
      const standardError = new Error('Standard error message');

      handler.handleTelemetry({
        trace: null,
        exceptions: [{ exception: standardError, properties: {} }],
      });

      const actual = client.exceptions[0];
      const expected = {
        exception: standardError,
        properties: {},
      } satisfies TelemetryDataException;

      expect(actual).toEqual(expected);
    });
  });
});
