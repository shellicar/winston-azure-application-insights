import { createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import { defaultClient, setup } from 'applicationinsights';
import { createLogger, format, transports } from 'winston';

// By default uses process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
setup().start();

const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});

const logger = createLogger({
  format: format.combine(format.json()),
  transports: [transport, new transports.Console()],
});

logger.info('Hello World');
