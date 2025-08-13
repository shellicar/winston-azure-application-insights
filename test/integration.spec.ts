import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import { ApplicationInsightsV2TelemetryHandler } from '../src/ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from '../src/ApplicationInsightsV3TelemetryHandler';
import type { TelemetryHandler } from '../src/types';
import { SpyTelemetryClientV2 } from './spies/SpyTelemetryClientV2';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

type TelemetryHandlerConfig =
  | {
      version: 2;
      client: TelemetryClientV2;
      traceFilter?: (trace: TraceTelemetryV2) => boolean;
      exceptionFilter?: (exception: ExceptionTelemetryV2) => boolean;
    }
  | {
      version: 3;
      client: TelemetryClientV3;
      traceFilter?: (trace: TraceTelemetryV3) => boolean;
      exceptionFilter?: (exception: ExceptionTelemetryV3) => boolean;
    };

function createTelemetryHandler(config: TelemetryHandlerConfig): TelemetryHandler {
  if (config.version === 2) {
    return new ApplicationInsightsV2TelemetryHandler({
      client: config.client,
      traceFilter: config.traceFilter,
      exceptionFilter: config.exceptionFilter,
    });
  }

  return new ApplicationInsightsV3TelemetryHandler({
    client: config.client,
    traceFilter: config.traceFilter,
    exceptionFilter: config.exceptionFilter,
  });
}

describe('Integration: Winston → Transport → TelemetryHandler → Azure SDK', () => {
  describe('V2 Integration', () => {
    let client: SpyTelemetryClientV2;
    let handler: ApplicationInsightsV2TelemetryHandler;
    let transport: ApplicationInsightsTransport;
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      client = new SpyTelemetryClientV2();
      handler = new ApplicationInsightsV2TelemetryHandler({ client });
      transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      logger = createLogger({ transports: [transport] });
      client.clear();
    });

    it('should send trace through full pipeline', () => {
      logger.info('Hello from V2');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Hello from V2');
      expect(client.exceptions).toHaveLength(0);
    });

    it('should send exception through full pipeline', () => {
      const error = new Error('V2 test error');
      logger.error('Error occurred', error);

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Error occurred');
      expect(client.exceptions).toHaveLength(1);
      expect(client.exceptions[0].exception).toBe(error);
    });

    it('should apply trace filter in full pipeline', () => {
      client = new SpyTelemetryClientV2();
      handler = new ApplicationInsightsV2TelemetryHandler({
        client,
        traceFilter: (trace) => trace.message !== 'filtered',
      });
      transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      logger = createLogger({ transports: [transport] });

      logger.info('allowed');
      logger.info('filtered');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('allowed');
    });
  });

  describe('V3 Integration', () => {
    let client: SpyTelemetryClientV3;
    let handler: ApplicationInsightsV3TelemetryHandler;
    let transport: ApplicationInsightsTransport;
    let logger: ReturnType<typeof createLogger>;

    beforeEach(() => {
      client = new SpyTelemetryClientV3();
      handler = new ApplicationInsightsV3TelemetryHandler({ client });
      transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      logger = createLogger({ transports: [transport] });
      client.clear();
    });

    it('should send trace through full pipeline', () => {
      logger.info('Hello from V3');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Hello from V3');
      expect(client.exceptions).toHaveLength(0);
    });

    it('should send exception through full pipeline', () => {
      const error = new Error('V3 test error');
      logger.error('Error occurred', error);

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Error occurred');
      expect(client.exceptions).toHaveLength(1);
      expect(client.exceptions[0].exception).toBe(error);
    });

    it('should apply exception filter in full pipeline', () => {
      client = new SpyTelemetryClientV3();
      handler = new ApplicationInsightsV3TelemetryHandler({
        client,
        exceptionFilter: (exception) => exception.exception.message !== 'filtered error',
      });
      transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      logger = createLogger({ transports: [transport] });

      const allowedError = new Error('allowed error');
      const filteredError = new Error('filtered error');

      logger.error('First error', allowedError);
      logger.error('Second error', filteredError);

      expect(client.exceptions).toHaveLength(1);
      expect(client.exceptions[0].exception).toBe(allowedError);
    });
  });

  describe('Factory Function Integration', () => {
    it('should call trackTrace on V2 client when logging through factory-created handler', () => {
      const client = new SpyTelemetryClientV2();
      const handler = createTelemetryHandler({ version: 2, client });
      const transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      const logger = createLogger({ transports: [transport] });

      logger.info('Factory V2 test');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Factory V2 test');
    });

    it('should call trackTrace on V3 client when logging through factory-created handler', () => {
      const client = new SpyTelemetryClientV3();
      const handler = createTelemetryHandler({ version: 3, client });
      const transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      const logger = createLogger({ transports: [transport] });

      logger.info('Factory V3 test');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0].message).toBe('Factory V3 test');
    });

    it('should call trace filter when logging through factory-created V2 handler', () => {
      const client = new SpyTelemetryClientV2();
      let filterCalled = false;
      let capturedTrace: TraceTelemetryV2 | undefined;

      const traceFilter = (trace: TraceTelemetryV2) => {
        filterCalled = true;
        capturedTrace = trace;
        return true;
      };

      const handler = createTelemetryHandler({ version: 2, client, traceFilter });
      const transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      const logger = createLogger({ transports: [transport] });

      logger.warn('Filter test message');

      expect(filterCalled).toBe(true);
      expect(capturedTrace?.message).toBe('Filter test message');
      expect(client.traces).toHaveLength(1);
    });

    it('should call exception filter when logging error through factory-created V3 handler', () => {
      const client = new SpyTelemetryClientV3();
      let filterCalled = false;
      let capturedException: ExceptionTelemetryV3 | undefined;

      const exceptionFilter = (exception: ExceptionTelemetryV3) => {
        filterCalled = true;
        capturedException = exception;
        return true;
      };

      const handler = createTelemetryHandler({ version: 3, client, exceptionFilter });
      const transport = new ApplicationInsightsTransport({ telemetryHandler: handler });
      const logger = createLogger({ transports: [transport] });

      const testError = new Error('Test exception');
      logger.error('Error message', testError);

      expect(filterCalled).toBe(true);
      expect(capturedException?.exception).toBe(testError);
      expect(client.exceptions).toHaveLength(1);
    });
  });

  it('should handle Object.create(null) objects from Apollo Server errors', () => {
    const telemetryHandler = new SpyTelemetryHandler();
    const transport = new ApplicationInsightsTransport({ telemetryHandler });
    const logger = createLogger({
      defaultMeta: { service: 'graphql-api' },
      transports: [transport],
    });

    const apolloError = Object.create(null);
    apolloError.errorCode = 'APOLLO_VALIDATION_ERROR';
    apolloError.extensions = {
      code: 'GRAPHQL_VALIDATION_FAILED',
      field: 'userInput',
    };

    logger.error('GraphQL validation failed', apolloError);

    expect(telemetryHandler.telemetry?.trace?.properties).toEqual({
      service: 'graphql-api',
      errorCode: 'APOLLO_VALIDATION_ERROR',
      extensions: {
        code: 'GRAPHQL_VALIDATION_FAILED',
        field: 'userInput',
      },
    });
  });
});
