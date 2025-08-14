import { type TelemetryData, type TelemetryHandler, createWinstonLogger } from '@shellicar/winston-azure-application-insights';

class CustomTelemetryHandler implements TelemetryHandler {
  handleTelemetry(telemetry: TelemetryData) {
    console.log('Custom Telemetry Handler:', telemetry);
  }
}

const handler = new CustomTelemetryHandler();

const logger = createWinstonLogger({
  insights: {
    handler,
  },
});

logger.info('Hello world');
