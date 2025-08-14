import { createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsightsv2';
import { type Logger, createLogger } from 'winston';
import type TransportStream from 'winston-transport';

applicationinsights.setup().start();

// Create transport separately
const transport: TransportStream = createApplicationInsightsTransport({
  version: 2,
  client: applicationinsights.defaultClient,
});

const logger: Logger = createLogger({
  transports: [transport],
});
