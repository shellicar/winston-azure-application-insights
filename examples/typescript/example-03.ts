import { ApplicationInsightsVersion, createApplicationInsightsTransport, createTelemetryHandler, type TelemetryHandler } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsightsv2';
import { createLogger, type Logger } from 'winston';
import type TransportStream from 'winston-transport';

applicationinsights.setup().start();

// Create handler and transport separately
const telemetryHandler: TelemetryHandler = createTelemetryHandler({
  version: ApplicationInsightsVersion.V2,
  client: applicationinsights.defaultClient,
});

const transport: TransportStream = createApplicationInsightsTransport({
  telemetryHandler,
});

const logger: Logger = createLogger({
  transports: [transport],
});
