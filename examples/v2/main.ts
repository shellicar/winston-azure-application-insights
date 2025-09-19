import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V2,
    client: applicationinsights.defaultClient,
  },
  winston: {
    defaults: {
      defaultMeta: {
        applicationinsights: '2.9.6',
      },
    },
  },
});
logger.info('Hello from V2 example!');
