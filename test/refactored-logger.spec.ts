import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { RefactoredAzureApplicationInsightsTransport, type WinstonInfo, splatSymbol, unconcatenateStep } from '../src/refactored-logger';

const telemetryHandler = {
  telemetry: { message: '' },
  handleTelemetry: (telemetry: { message: string }) => {
    telemetryHandler.telemetry = telemetry;
  },
};

describe('Refactored AzureApplicationInsightsLogger', () => {
  describe('Transport', () => {
    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler,
    });
    const logger = createLogger({
      transports: [transport],
    });

    it('should work as a winston transport', () => {
      expect(() => {
        logger.info('test message');
      }).not.toThrow();
    });

    it('should call telemetry handler when logging', () => {
      const expected = 'test message';

      transport.log({ level: 'info', message: expected }, () => {});

      const actual = telemetryHandler.telemetry.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with just message', () => {
      const expected = 'just a message';

      logger.info(expected);

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with message and object', () => {
      const expected = 'message with data';

      logger.info(expected, { userId: 123, action: 'login' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });

    it('should receive winston info with just error', () => {
      const expected = 'something failed';

      const error = new Error(expected);
      logger.error(error);

      const actual = telemetryHandler.telemetry.message;

      expect(actual).toBe(expected);
    });

    it('should receive winston info with message property in object', () => {
      const expected = 'hello world';

      logger.info('hello', { message: 'world' });

      const actual = telemetryHandler.telemetry.message;
      expect(actual).toBe(expected);
    });
  });

  describe('unconcatenateStep', () => {
    it('should unconcatenate winston message in pipeline step', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello world',
        [splatSymbol]: [{ message: 'world' }],
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate different messages', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'goodbye universe',
        [splatSymbol]: [{ message: 'universe' }],
      };

      const result = unconcatenateStep(info);
      expect(result.message).toBe('goodbye');
    });

    it('should unconcatenate object message property', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello [object Object]',
        [splatSymbol]: [{ message: { x: '5' } }],
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate number message property', () => {
      const expected = 'hello';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello 50',
        [splatSymbol]: [{ message: 50 }],
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate null message property', () => {
      const expected = 'Hello';

      const info: WinstonInfo = {
        level: 'info',
        message: expected,
        [splatSymbol]: [{ message: null }],
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should unconcatenate error', () => {
      const expected = 'Hello';
      const transport = new RefactoredAzureApplicationInsightsTransport({
        telemetryHandler,
      });

      const logger = createLogger({
        transports: [transport],
      });

      const meta = new Error('World');
      logger.info(expected, meta);

      const winstonResult = telemetryHandler.telemetry.message;

      const info: WinstonInfo = {
        level: 'info',
        message: winstonResult,
        [splatSymbol]: [meta],
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('should return unchanged when no splat', () => {
      const expected = 'hello world';

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello world',
      };

      const result = unconcatenateStep(info);
      const actual = result.message;

      expect(actual).toBe(expected);
    });
  });
});
