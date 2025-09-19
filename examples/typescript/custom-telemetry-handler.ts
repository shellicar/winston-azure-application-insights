import { createWinstonLogger, type TelemetryData, type TelemetryHandler } from '@shellicar/winston-azure-application-insights';

class CustomTelemetryHandler implements TelemetryHandler {
  handleTelemetry(telemetry: TelemetryData) {
    console.log('Custom Telemetry Handler:', telemetry);
  }
}

const telemetryHandler = new CustomTelemetryHandler();

const logger = createWinstonLogger({
  insights: {
    telemetryHandler,
  },
});

logger.info('Hello world');
