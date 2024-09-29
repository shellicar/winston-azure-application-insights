import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import { defaultClient, setup } from 'applicationinsights';

setup().start();
const logger = createWinstonLogger(defaultClient);

logger.info('Hello World');
