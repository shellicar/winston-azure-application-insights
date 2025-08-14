import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import { CustomTelemetryHandler } from './CustomTelemetryHandler';

const handler = new CustomTelemetryHandler();

const logger = createWinstonLogger({
  insights: {
    handler,
  },
});

logger.info('Hello world');
