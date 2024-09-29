import { setup, defaultClient } from 'applicationinsights';
import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';

setup().start();
const logger = createWinstonLogger(defaultClient);

logger.info('Hello World');
