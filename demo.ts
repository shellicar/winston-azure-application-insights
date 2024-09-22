import winston from 'winston';
import { setup, defaultClient } from 'applicationinsights';
import { AzureApplicationInsightsLogger } from './src/winston-azure-application-insights';

const shouldPushToAppInsights = 'APPLICATIONINSIGHTS_CONNECTION_STRING' in process.env;

if (shouldPushToAppInsights) {
  setup().start();
  winston.add(new AzureApplicationInsightsLogger({
    client: defaultClient,
  }));
} else {
  winston.add(new winston.transports.Console());
}

winston.info('Let\'s log something new...');
winston.error('This is an error log!');
winston.warn('And this is a warning message.');
winston.log('info', 'Log with some metadata', {
  question: 'Answer to the Ultimate Question of Life, the Universe, and Everything',
  answer: 42,
});

class ErrorWithMeta extends Error {
  arg1: string;
  arg2: number;

  constructor(message: string, arg1: string, arg2: number) {
    super(message);
    this.message = message;
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.name = 'ExtendedError';
  }
}

winston.error('Log extended errors with properties', new ErrorWithMeta('some error', 'answer', 42));
