import { setup, defaultClient } from 'applicationinsights';
import { AzureApplicationInsightsLogger } from '@shellicar/winston-azure-application-insights';
import { createLogger, transports, format } from 'winston';

// By default uses process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
setup().start();

const logger = createLogger({
  format: format.combine(
    format.errors(),
    format.json(),
  ),
  transports: [
    new AzureApplicationInsightsLogger({
      client: defaultClient,
    }),
    new transports.Console(),
  ],
});

logger.info('Hello World');
