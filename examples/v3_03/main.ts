import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V3,
    client: applicationinsights.defaultClient,
  },
  winston: {
    defaults: {
      defaultMeta: {
        applicationinsights: '3.3.0',
      },
    },
  },
});
logger.info('Hello from V3.3 example!');
