import { KnownSeverityLevel, TelemetryClient } from 'applicationinsightsv3';
import td from 'testdouble';
import { type Logger, createLogger } from 'winston';
import { AzureApplicationInsightsLogger } from '../src';
import { LogLevel } from '../src/types';

describe('log levels', () => {
  let logger: Logger;
  let aiTransport: AzureApplicationInsightsLogger;
  let mock: testdouble.DoubledObject<TelemetryClient>;
  let client: TelemetryClient | undefined;
  const levels = {
    special: LogLevel.Error,
  };

  beforeEach(() => {
    client = new TelemetryClient('InstrumentationKey=00000000-0000-0000-0000-000000000000');
    mock = td.object(client);
    aiTransport = new AzureApplicationInsightsLogger({
      version: 3,
      client: mock,
      levels,
      defaultLevel: 'special',
    });
    logger = createLogger({
      transports: [aiTransport],
      levels,
    });
  });

  it('special log works', () => {
    logger.log('special', 'hello world');
    td.verify(
      mock.trackTrace(
        td.matchers.contains({
          severity: KnownSeverityLevel.Error,
        }),
      ),
    );
  });
});
