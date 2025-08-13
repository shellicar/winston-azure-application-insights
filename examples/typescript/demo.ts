import { env } from 'node:process';
import { defaultClient, setup } from 'applicationinsights';
import winston from 'winston';
import { createApplicationInsightsTransport } from '../../src';

const shouldPushToAppInsights = 'APPLICATIONINSIGHTS_CONNECTION_STRING' in env;

if (shouldPushToAppInsights) {
  setup().start();
  const transport = createApplicationInsightsTransport({
    version: 3,
    client: defaultClient,
  });
  winston.add(transport);
} else {
  winston.add(new winston.transports.Console());
}

winston.info("Let's log something new...");
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

class MyError extends Error {
  public extensions: Record<string, any>;
  constructor(
    message: string,
    public readonly options: Record<string, any>,
  ) {
    super(message);
    this.extensions = options.extensions;
  }
}

const err = new MyError('test', {
  extensions: Object.create(null),
});
winston.info('hello world', err);
winston.info(err);

const err2 = new MyError('test-with-extensions', {
  extensions: {
    ext: Object.create(null),
    code: 'APOLLO_ERROR',
  },
});
winston.error(err2);
