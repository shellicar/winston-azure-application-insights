import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();
const logger = createWinstonLogger({
  winston: {
    console: {
      enabled: true,
    },
  },
  insights: {
    version: 3,
    client: applicationinsights.defaultClient,
  },
});

logger.info('Hello World');
