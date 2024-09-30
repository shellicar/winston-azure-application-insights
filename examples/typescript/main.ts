import { AzureApplicationInsightsLogger } from '@shellicar/winston-azure-application-insights';
import { defaultClient, setup } from 'applicationinsights';
import { createLogger, format, transports } from 'winston';

// By default uses process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
setup().start();

const logger = createLogger({
  format: format.combine(format.json()),
  transports: [
    new AzureApplicationInsightsLogger({
      version: 3,
      client: defaultClient,
    }),
    new transports.Console(),
  ],
});

logger.info('Hello World');
