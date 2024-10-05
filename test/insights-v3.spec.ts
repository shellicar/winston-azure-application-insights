import { KnownSeverityLevel, TelemetryClient } from 'applicationinsightsv3';
import td from 'testdouble';
import { type Logger, createLogger } from 'winston';
import { AzureApplicationInsightsLogger } from '../src';

describe('appinsights-v3', () => {
  let logger: Logger;
  let aiTransport: AzureApplicationInsightsLogger;
  let mock: testdouble.DoubledObject<TelemetryClient>;
  let client: TelemetryClient | undefined;

  beforeEach(() => {
    client = new TelemetryClient('InstrumentationKey=00000000-0000-0000-0000-000000000000');
    mock = td.object(client);
    aiTransport = new AzureApplicationInsightsLogger({
      version: 3,
      client: mock,
    });
    logger = createLogger({
      transports: [aiTransport],
    });
  });

  it('trace works', () => {
    logger.info('hello world');
    td.verify(
      mock.trackTrace(
        td.matchers.contains({
          severity: KnownSeverityLevel.Information,
        }),
      ),
    );
  });

  it('exception works', () => {
    const err = new Error('hi');
    logger.error(err);
    td.verify(
      mock.trackException(
        td.matchers.contains({
          exception: err,
        }),
      ),
    );
  });

  it('exception works 2', () => {
    const err = new Error('hi');
    logger.error('error', err);
    td.verify(
      mock.trackException(
        td.matchers.contains({
          exception: err,
        }),
      ),
    );
  });

  it('exception works 3', () => {
    const err = new Error('hi');
    logger.error('error', err);
    td.verify(
      mock.trackException(
        td.matchers.contains({
          exception: err,
        }),
      ),
    );
  });
});
