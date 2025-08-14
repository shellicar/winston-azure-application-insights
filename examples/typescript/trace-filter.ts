import { type ITraceTelemetryFilter, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';
import { CustomTelemetryHandler } from './CustomTelemetryHandler';

applicationinsights.setup().start();

const handler = new CustomTelemetryHandler();

const traceFilter: ITraceTelemetryFilter = (telemetry) => {
  if (telemetry.message.includes('Ignore')) {
    return false;
  }
  return true;
};

const logger = createWinstonLogger({
  insights: {
    handler,
    traceFilter,
  },
});

logger.info('Log this');
logger.info('Ignore this');
