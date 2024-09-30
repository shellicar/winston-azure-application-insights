import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import { defaultClient, setup } from 'applicationinsights';

setup().start();
const logger = createWinstonLogger({
  console: true,
  insights: {
    version: 3,
    client: defaultClient,
  },
});

logger.info('Hello World');
