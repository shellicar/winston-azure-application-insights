import { AzureApplicationInsightsLogger, type ITelemetryFilterV3 } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const filter = {
  filterException(trace) {
    console.log('Filtering exception:', trace);
    return true;
  },
  filterTrace(trace) {
    console.log('Filtering trace:', trace);
    return true;
  },
} satisfies ITelemetryFilterV3;

const transport = new AzureApplicationInsightsLogger({
  client: applicationinsights.defaultClient,
  version: 3,
  defaultLevel: 'info',
  filters: [filter],
  levels: {
    // info -> error
    info: 3,
    // error -> critical
    error: 4,
  },
  sendErrorsAsExceptions: true,
  silent: false,
});
