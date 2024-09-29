import { TelemetryClient } from 'applicationinsightsv2';
import { createWinstonLogger } from '../src';
import td from 'testdouble';
import { SeverityLevel } from 'applicationinsightsv2/out/Declarations/Contracts';

describe('appinsights-v2', () => {
  const client = new TelemetryClient('InstrumentationKey=00000000-0000-0000-0000-000000000000');
  const mock: testdouble.DoubledObject<TelemetryClient> = td.object(client);
  const logger = createWinstonLogger(mock);

  it('trace works', () => {
    logger.info('hello world');
    td.verify(mock.trackTrace(td.matchers.contains({
      severity: SeverityLevel.Information,
    })));
  });

  it('exception works', () => {
    const err = new Error('hi');
    logger.error(err);
    td.verify(mock.trackException(td.matchers.contains({
      exception: err,
    })));
  });
});
