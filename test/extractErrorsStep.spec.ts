import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import TransportStream from 'winston-transport';
import { splatSymbol } from '../src/consts';
import { extractErrorsStep } from '../src/extractErrorsStep';
import type { WinstonInfo } from '../src/types';
import type { TelemetryData } from '../src/types';

class ErrorTransport extends TransportStream {
  public errors: Error[] = [];
  override log(info: WinstonInfo, next: () => void) {
    this.errors = extractErrorsStep(info);
    next();
  }
}

const telemetryHandler = {
  telemetry: { message: '' } as TelemetryData | undefined,
  handleTelemetry: (telemetry: TelemetryData) => {
    telemetryHandler.telemetry = telemetry;
  },
  clear() {
    this.telemetry = undefined;
  },
};

describe('extractErrorsStep', () => {
  const transport = new ErrorTransport();
  const logger = createLogger({
    transports: [transport],
  });

  beforeEach(() => {
    telemetryHandler.clear();
    transport.errors = [];
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
  it('should handle empty splat array', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [splatSymbol]: [],
    };

    const actual = extractErrorsStep(info).length;
    const expected = 0;

    expect(actual).toBe(expected);
  });

  describe('should handle mixed types in splat', () => {
    const error1 = new Error('error1');
    const error2 = new Error('error2');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [splatSymbol]: ['string', 42, { userId: 123 }, error1, null, undefined, error2, true],
    };

    it('has two errors in splat', () => {
      const expected = 2;

      const result = extractErrorsStep(info);
      const actual = result.length;

      expect(actual).toBe(expected);
    });

    it('passes first error', () => {
      const expected = error1;

      const result = extractErrorsStep(info);
      const actual = result[0];

      expect(actual).toBe(expected);
    });

    it('passes second error', () => {
      const expected = error2;

      const result = extractErrorsStep(info);
      const actual = result[1];

      expect(actual).toBe(expected);
    });
  });

  it('should handle null and undefined items in splat', () => {
    const expected = new Error('test');

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello',
      [splatSymbol]: [null, undefined, expected, null],
    };

    const actual = extractErrorsStep(info)[0];

    expect(actual).toBe(expected);
  });
});
