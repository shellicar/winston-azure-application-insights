import { createWinstonLogger, type IExceptionTelemetryFilter, type TelemetryData, type TelemetryHandler } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';
import winston from 'winston';

class CustomTelemetryHandler implements TelemetryHandler {
  handleTelemetry(telemetry: TelemetryData) {
    console.log('Custom Telemetry Handler:', telemetry);
  }
}

applicationinsights.setup().start();

const telemetryHandler = new CustomTelemetryHandler();

class MyCustomError extends Error {}

const exceptionFilter: IExceptionTelemetryFilter = (telemetry) => {
  if (telemetry.exception instanceof MyCustomError) {
    return false;
  }
  return true;
};

const logger = createWinstonLogger({
  insights: {
    telemetryHandler,
    exceptionFilter,
  },
  winston: {
    console: {
      format: [winston.format.timestamp(), winston.format.json(), winston.format.errors({ stack: true })],
    },
  },
});

logger.info('Log this');
logger.error(new Error('This will be logged'));
logger.error(new MyCustomError('This will not be logged'));
