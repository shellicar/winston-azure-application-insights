import { ApplicationInsightsVersion, createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsightsv2';
import { createLogger, type Logger } from 'winston';
import type TransportStream from 'winston-transport';

applicationinsights.setup().start();

// Create transport separately
const transport: TransportStream = createApplicationInsightsTransport({
  version: ApplicationInsightsVersion.V2,
  client: applicationinsights.defaultClient,
});

const logger: Logger = createLogger({
  transports: [transport],
});
