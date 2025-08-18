import { ApplicationInsightsVersion, createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, TelemetrySeverity } from '@shellicar/winston-azure-application-insights';
import applicaioninsights from 'applicationinsightsv3';

applicaioninsights.setup().start();

const client = applicaioninsights.defaultClient;
client.commonProperties.module = 'esm';

const telemetryHandler = createTelemetryHandler({
  client,
  version: ApplicationInsightsVersion.V3,
});
telemetryHandler.handleTelemetry({
  exceptions: [],
  trace: {
    message: 'Hello handler',
    properties: {},
    severity: TelemetrySeverity.Information,
  },
});

const transport1 = createApplicationInsightsTransport({
  client,
  version: ApplicationInsightsVersion.V3,
});
transport1.log?.(
  {
    level: 'info',
    message: 'Hello transport1',
  },
  () => {},
);

const transport2 = createApplicationInsightsTransport({
  telemetryHandler,
});
transport2.log?.(
  {
    level: 'info',
    message: 'Hello transport2',
  },
  () => {},
);

const logger = createWinstonLogger({
  winston: {},
  insights: {
    version: ApplicationInsightsVersion.V3,
    client,
  },
});
logger.info('Hello logger');
