import applicationinsights from 'applicationinsights';
import 'winston';
import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    client: applicationinsights.defaultClient,
    version: ApplicationInsightsVersion.V3,
  },
  winston: {
    insights: {
      level: 'info',
    },
    console: {
      level: 'verbose',
    },
  },
});

logger.verbose('This is a verbose log message - console only');
logger.info('This is an info log message - sent to both transports');
