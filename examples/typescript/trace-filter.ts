import { createWinstonLogger, type ITraceTelemetryFilter, type TelemetryData, type TelemetryHandler } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

class CustomTelemetryHandler implements TelemetryHandler {
  handleTelemetry(telemetry: TelemetryData) {
    console.log('Custom Telemetry Handler:', telemetry);
  }
}

const telemetryHandler = new CustomTelemetryHandler();

const traceFilter: ITraceTelemetryFilter = (telemetry) => {
  if (telemetry.message.includes('Ignore')) {
    return false;
  }
  return true;
};

const logger = createWinstonLogger({
  insights: {
    telemetryHandler,
    traceFilter,
  },
});

logger.info('Log this');
logger.info('Ignore this');
