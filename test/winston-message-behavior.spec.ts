import { describe, it } from 'vitest';
import { createLogger, format, transports } from 'winston';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../src/types';

class DebugTransport extends TransportStream {
  constructor() {
    super({ silent: false });
  }

  log(info: WinstonInfo, callback: () => void) {
    console.log('=== SPLAT INSPECTION ===');
    console.log('Message:', info.message);
    console.log('Message type:', typeof info.message);
    console.log('Message constructor:', (info.message as any)?.constructor?.name);
    console.log('Info instanceof Error:', info instanceof Error); // ← Add this check

    if ((info.message as any) instanceof Error) {
      const errorMessage = info.message as unknown as Error;
      console.log('Message is Error:', {
        message: errorMessage.message,
        stack: errorMessage.stack,
      });
    }

    const splat = info[Symbol.for('splat')];
    console.log('Splat symbol:', splat);

    if (Array.isArray(splat)) {
      console.log('Splat items:');
      splat.forEach((item, index) => {
        console.log(`  [${index}]:`, item);
        if (item instanceof Error) {
          console.log(`    Error message: ${item.message}`);
          console.log(`    Error stack: ${item.stack}`);
        }
      });
    }

    console.log('Full info keys:', Object.keys(info));
    console.log('==================');
    callback();
  }
}

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

  describe('Edge case behaviors', () => {
    const logger = createLogger({
      format: format.simple(),
      transports: [new transports.Console({ silent: false })],
    });

    it('should demonstrate winston behavior with functions', () => {
      console.log('=== Testing with functions ===');
      const testFunction = () => 'test';
      logger.info('Function test', testFunction);
    });

    it('should demonstrate winston behavior with function as property', () => {
      console.log('=== Testing with function as property ===');
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });
    });

    it('should demonstrate winston behavior with arrays', () => {
      console.log('=== Testing with arrays ===');
      logger.info('Array test', [1, 2, 3]);
    });

    it('should demonstrate winston behavior with dates', () => {
      console.log('=== Testing with dates ===');
      logger.info('Date test', new Date('2025-01-01'));
    });

    it('should demonstrate winston behavior with regex', () => {
      console.log('=== Testing with regex ===');
      logger.info('Regex test', /hello/g);
    });

    it('should demonstrate winston behavior with custom classes', () => {
      console.log('=== Testing with custom classes ===');
      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }

      logger.info('Custom class test', new CustomClass());
    });
  });

  describe('Splat inspection', () => {
    it('should show what Winston puts in the splat for each type', () => {
      const debugTransport = new DebugTransport();

      const logger = createLogger({
        transports: [debugTransport],
      });

      console.log('--- Function directly ---');
      const testFunction = () => 'test';
      logger.info('Function test', testFunction);

      console.log('--- Function as property ---');
      const callback = () => console.log('callback executed');
      logger.info('Function property test', { userId: 123, callback: callback });

      console.log('--- Array ---');
      logger.info('Array test', [1, 2, 3]);

      console.log('--- Date ---');
      logger.info('Date test', new Date('2025-01-01'));

      console.log('--- Custom class ---');
      class CustomClass {
        prop = 'value';
        toString() {
          return 'CustomClass instance';
        }
      }
      logger.info('Custom class test', new CustomClass());

      console.log('--- Error object ---');
      logger.error(new Error('Database error'));

      console.log('--- Error with message ---');
      logger.error('Custom message', new Error('Database error'));
    });
  });
});
