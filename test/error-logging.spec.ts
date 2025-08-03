import { TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';
import * as td from 'testdouble';
import { beforeEach, describe, it } from 'vitest';
import { createLogger, format } from 'winston';
import { AzureApplicationInsightsLogger } from '../src/winston-azure-application-insights';

describe('Error Logging Behavior', () => {
  let mock: testdouble.DoubledObject<TelemetryClientV3>;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    const client = new TelemetryClientV3('InstrumentationKey=00000000-0000-0000-0000-000000000000');
    mock = td.object(client);

    logger = createLogger({
      format: format.combine(format.json()),
      transports: [
        new AzureApplicationInsightsLogger({
          version: 3,
          sendErrorsAsExceptions: true,
          client: mock,
        }),
      ],
    });
  });

  it('should send error object as both trace and exception', () => {
    const testError = new Error('Test error message');

    logger.error(testError);

    td.verify(mock.trackException(td.matchers.anything()));
  });

  it('should send error as second parameter as both trace and exception', () => {
    const testError = new Error('Test error message');

    logger.error('My error message', testError);

    td.verify(mock.trackException(td.matchers.anything()));
  });

  it('should send error in later splat position as exception', () => {
    const testError = new Error('Test error message');

    logger.error('My error message', 'more details', testError);

    td.verify(mock.trackException(td.matchers.anything()));
  });

  it('should send all errors when multiple errors in splat', () => {
    const firstError = new Error('First error');
    const secondError = new Error('Second error');

    logger.error('Multiple errors occurred', firstError, secondError);

    td.verify(mock.trackException(td.matchers.contains({ exception: firstError })));
    td.verify(mock.trackException(td.matchers.contains({ exception: secondError })));
  });

  it('should not send nested error object as exception', () => {
    const testError = new Error('Test error message');

    logger.error('Something went wrong', { error: testError, userId: 123 });

    td.verify(mock.trackException(td.matchers.anything()), { times: 0 });
  });

  it('should not send warning level error as exception', () => {
    const testError = new Error('Test error message');

    logger.warn('Warning message', testError);

    td.verify(mock.trackException(td.matchers.anything()), { times: 0 });
  });

  it('should send warning level error as trace', () => {
    const testError = new Error('Test error message');

    logger.warn('Warning message', testError);

    td.verify(mock.trackTrace(td.matchers.anything()));
  });

  it('should detect winston serialized error objects', () => {
    const winstonSerializedError = {
      message: 'Test error message',
      stack: 'Error: Test error message\n    at test.js:1:1',
      name: 'Error',
      level: 'error',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    logger.error('Error occurred', winstonSerializedError);

    td.verify(mock.trackTrace(td.matchers.anything()));
    td.verify(mock.trackException(td.matchers.anything()));
  });
});
