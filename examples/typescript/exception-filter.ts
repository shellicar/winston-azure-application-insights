import { type IExceptionTelemetryFilter, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';
import winston from 'winston';
import { CustomTelemetryHandler } from './CustomTelemetryHandler';

applicationinsights.setup().start();

const handler = new CustomTelemetryHandler();

class MyCustomError extends Error {}

const exceptionFilter: IExceptionTelemetryFilter = (telemetry) => {
  if (telemetry.exception instanceof MyCustomError) {
    return false;
  }
  return true;
};

const logger = createWinstonLogger({
  insights: {
    handler,
    exceptionFilter,
  },
  winston: {
    format: [
      // winston.format.timestamp(),
      winston.format.json(),
      winston.format.errors({ stack: true }),
    ],
  },
});

logger.info('Log this');
logger.error(new Error('This will be logged'));
logger.error(new MyCustomError('This will not be logged'));
