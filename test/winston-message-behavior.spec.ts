import { describe, it } from 'vitest';
import { createLogger, format, transports } from 'winston';

describe('Winston Message Behavior', () => {
  it('should demonstrate winston behavior with json format', () => {
    const logger = createLogger({
      format: format.combine(format.json()),
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing with JSON format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });

  it('should demonstrate winston behavior without json format', () => {
    const logger = createLogger({
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing without JSON format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });

  it('should demonstrate winston behavior with simple format', () => {
    const logger = createLogger({
      format: format.simple(),
      transports: [new transports.Console({ silent: false })],
    });

    console.log('=== Testing with simple format ===');
    logger.info('Hello', { message: 'World', userId: 123 });
    logger.info('Hello world');
    logger.info('Hello', { userId: 123, context: 'test' });
  });
});
