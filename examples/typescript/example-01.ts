import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsightsv2';
import { format } from 'logform';
import type { Logger } from 'winston';

applicationinsights.setup().start();

// All in one config
const logger: Logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V2,
    client: applicationinsights.defaultClient,
  },
  winston: {
    console: {
      format: [format.simple()],
    },
  },
});

logger.info('Hello world');
logger.error(new Error('This is an error!'));
