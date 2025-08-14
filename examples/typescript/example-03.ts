import { type TelemetryHandler, createApplicationInsightsTransport, createTelemetryHandler } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsightsv2';
import { type Logger, createLogger } from 'winston';
import type TransportStream from 'winston-transport';

applicationinsights.setup().start();

// Create handler and transport separately
const handler: TelemetryHandler = createTelemetryHandler({
  version: 2,
  client: applicationinsights.defaultClient,
});

const transport: TransportStream = createApplicationInsightsTransport({
  handler,
});

const logger: Logger = createLogger({
  transports: [transport],
});
