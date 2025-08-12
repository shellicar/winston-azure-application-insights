import { SPLAT } from 'triple-beam';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { extractErrorsStep } from '../src/extractErrorsStep';
import { isError } from '../src/isError';
import type { WinstonInfo } from '../src/types';
import { SpyErrorTransport } from './spies/SpyErrorTransport';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('extractErrorsStep', () => {
  const transport = new SpyErrorTransport();
  const logger = createLogger({
    transports: [transport],
  });

  it('should extract error when info is an Error', () => {
    const expected = new Error('single error logged');
    logger.error(expected);

    const actual = transport.errors[0];

    expect(actual).toBe(expected);
  });

  it('should return empty array when no errors', () => {
    logger.error('hello world');

    const actual = transport.errors.length;
    const expected = 0;

    expect(actual).toBe(expected);
  });

  it('should return all errors', () => {
    logger.error('Error: 1', new Error('2'), new Error('3'));

    const actual = transport.errors.length;
    const expected = 2;

    expect(actual).toBe(expected);
  });

  it('does not extract first error as winston treats it as a string', () => {
    // @ts-expect-error - Argument of type 'Error' is not assignable to parameter of type 'string'.
    logger.error(new Error('first'), new Error('second'), new Error('third'));

    const actual = transport.errors.length;
    const expected = 2;

    expect(actual).toBe(expected);
  });

  it('should handle empty splat array', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: [],
    };

    const actual = extractErrorsStep(info, isError).length;
    const expected = 0;

    expect(actual).toBe(expected);
  });

  describe('should handle mixed types in splat', () => {
    const error1 = new Error('error1');
    const error2 = new Error('error2');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: ['string', 42, { userId: 123 }, error1, null, undefined, error2, true],
    };

    it('has two errors in splat', () => {
      const expected = 2;

      const result = extractErrorsStep(info, isError);
      const actual = result.length;

      expect(actual).toBe(expected);
    });

    it('passes first error', () => {
      const expected = error1;

      const result = extractErrorsStep(info, isError);
      const actual = result[0];

      expect(actual).toBe(expected);
    });

    it('passes second error', () => {
      const expected = error2;

      const result = extractErrorsStep(info, isError);
      const actual = result[1];

      expect(actual).toBe(expected);
    });
  });

  it('should handle null and undefined items in splat', () => {
    const expected = new Error('test');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [SPLAT]: [null, undefined, expected, null],
    };

    const actual = extractErrorsStep(info, isError)[0];

    expect(actual).toBe(expected);
  });
});
