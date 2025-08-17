import { type ITelemetryFilterV3, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights, { KnownSeverityLevel } from 'applicationinsights';
import winston from 'winston';

applicationinsights.setup().start();

const filter = {
  filterException(trace) {
    console.log('Filtering exception:', trace);
    return true;
  },
  filterTrace(trace) {
    console.log('Filtering trace:', trace);
    return true;
  },
} satisfies ITelemetryFilterV3;

const logger = createWinstonLogger({
  insights: {
    client: applicationinsights.defaultClient,
    version: 3,
    defaultLevel: 'info',
    filters: [filter],
    levels: {
      // info -> error
      info: 3,
      // error -> critical
      error: 4,
    },
    sendErrorsAsExceptions: true,
    silent: false,
  },
  winston: {
    console: true,
    defaultMeta: {
      myDefault: 'meta',
    },
    format: [winston.format.timestamp(), winston.format.errors(), winston.format.json()],
    level: 'verbose',
    levels: winston.config.npm.levels,
  },
});

logger.info('This is an info message');
logger.error('This is an error message', new Error('Test error'));
