import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  winston: {
    console: {
      enabled: true,
    },
    defaults: {
      level: 'info',
      defaultMeta: { service: 'my-app' },
    },
  },
  insights: {
    version: ApplicationInsightsVersion.V3,
    client: applicationinsights.defaultClient,
  },
});

logger.info('Hello from Winston + Application Insights!');
logger.error('Something went wrong', new Error('Oops!'));
