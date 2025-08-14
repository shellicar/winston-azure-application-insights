import { TelemetrySeverity, createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import * as applicaioninsights from 'applicationinsightsv3';

applicaioninsights.setup().start();

const client = applicaioninsights.defaultClient;
client.commonProperties.module = 'cjs';

const handler = createTelemetryHandler({
  client,
  version: 3,
});
handler.handleTelemetry({
  exceptions: [],
  trace: {
    message: 'Hello handler',
    properties: {},
    severity: TelemetrySeverity.Information,
  },
});

const transport1 = createApplicationInsightsTransport({
  client,
  version: 3,
});
transport1.log(
  {
    level: 'info',
    message: 'Hello transport1',
    properties: {},
  },
  () => {},
);

const transport2 = createApplicationInsightsTransport({
  handler,
});
transport2.log(
  {
    level: 'info',
    message: 'Hello transport2',
    properties: {},
  },
  () => {},
);

const logger = createWinstonLogger({
  winston: {},
  insights: {
    version: 3,
    client,
  },
});
logger.info('Hello logger');
