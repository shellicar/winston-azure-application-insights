import { ApplicationInsightsVersion, createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';
import { createLogger, format, transports } from 'winston';

// By default uses process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
applicationinsights.setup().start();

const transport = createApplicationInsightsTransport({
  version: ApplicationInsightsVersion.V3,
  client: applicationinsights.defaultClient,
});

const logger = createLogger({
  format: format.combine(format.json()),
  transports: [transport, new transports.Console()],
});

logger.info('Hello World');
