import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V3,
    client: applicationinsights.defaultClient,
  },
});

logger.info("Let's log something new...");
logger.error('This is an error log!');
logger.warn('And this is a warning message.');
logger.log('info', 'Log with some metadata', {
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

logger.error('Log extended errors with properties', new ErrorWithMeta('some error', 'answer', 42));

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
logger.info('hello world', err);
logger.info(err);

const err2 = new MyError('test-with-extensions', {
  extensions: {
    ext: Object.create(null),
    code: 'APOLLO_ERROR',
  },
});
logger.error(err2);
