import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/private/ApplicationInsightsTransport';
import { extractMessageStep } from '../src/private/extractMessageStep';
import type { WinstonInfo } from '../src/private/types';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';
import { createWinstonInfo } from './createWinstonInfoWithErrorInSplat';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('extractMessageStep', () => {
  const telemetryHandler = new SpyTelemetryHandler();

  it('should extract winston message in pipeline step', () => {
    const expected = 'hello';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello world',
      [SPLAT]: [{ message: 'world' }],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract different messages', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'goodbye universe',
      [SPLAT]: [{ message: 'universe' }],
    };

    const actual = extractMessageStep(info);
    const expected = 'goodbye';

    expect(actual).toBe(expected);
  });

  it('should extract object message property', () => {
    const expected = 'hello';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello [object Object]',
      [SPLAT]: [{ message: { x: '5' } }],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should merge strings in splat', () => {
    const expected = 'Hello world';

    const info: WinstonInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: ['world'],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should merge multiple strings in splat', () => {
    const expected = 'Hello world two';

    const info: WinstonInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: ['world', 'two'],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should merge and unmerge', () => {
    const expected = 'Hello world two';

    const info: WinstonInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: ['world', 'two'],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract number message property', () => {
    const expected = 'hello';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello 50',
      [SPLAT]: [{ message: 50 }],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract null message property', () => {
    const expected = 'Hello';

    const info: WinstonInfo = {
      level: 'info',
      message: expected,
      [SPLAT]: [{ message: null }],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract error', () => {
    const expected = 'Hello';
    const transport = new ApplicationInsightsTransport({
      telemetryHandler,
    });

    const logger = createLogger({
      transports: [transport],
    });

    const meta = new Error('World');
    logger.info(expected, meta);

    const winstonResult = telemetryHandler.telemetry!.trace!.message;

    const info: WinstonInfo = {
      level: 'info',
      message: winstonResult,
      [SPLAT]: [meta],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should return unchanged when no splat', () => {
    const expected = 'hello world';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello world',
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract error objects from splat', () => {
    const expected = 'Error: 1';
    const transport = new ApplicationInsightsTransport({
      telemetryHandler,
    });

    const logger = createLogger({
      transports: [transport],
    });

    logger.error('Error: 1', new Error('2'), new Error('3'));

    const winstonResult = telemetryHandler.telemetry!.trace!.message;

    const info: WinstonInfo = {
      level: 'error',
      message: winstonResult,
      [SPLAT]: [new Error('2'), new Error('3')],
    };

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should handle Error object as message when info is Error instance (from winston behaviour)', () => {
    const expected = 'Database connection failed';

    const testError = new Error('Database connection failed');
    const info = createWinstonInfoFromErrorOnly(testError);

    const actual = extractMessageStep(info);

    expect(actual).toBeTypeOf('string');
    expect(actual).toBe(expected);
  });

  it('should extract original message when Error is in first splat position (from winston behaviour)', () => {
    const expected = 'Connection failed';

    const testError = new Error('Database error');
    const info = createWinstonInfo({ message: 'Connection failed', level: 'error' }, testError);

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  it('should extract original message when Error is in first splat position with extra data (from winston behaviour)', () => {
    // NOTE: Change in behaviour, will concatenate all strings as of 6.0.2
    const expected = 'Connection failed extra data';

    const testError = new Error('Database error');
    const info = createWinstonInfo({ message: 'Connection failed', level: 'error', [SPLAT]: ['extra data'] }, testError);

    const actual = extractMessageStep(info);

    expect(actual).toBe(expected);
  });

  describe('Edge cases with non-string message', () => {
    it('should convert number to string', () => {
      const expected = '42';

      const info: WinstonInfo = {
        level: 'error',
        message: 42,
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });

    it('should convert null to string', () => {
      const expected = 'null';

      const info: WinstonInfo = {
        level: 'error',
        message: null,
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });

    it('should convert undefined to string', () => {
      const expected = 'undefined';

      const info: WinstonInfo = {
        level: 'error',
        message: undefined,
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });

    it('should convert object to string', () => {
      const expected = '[object Object]';

      const info: WinstonInfo = {
        level: 'error',
        message: { foo: 'bar', baz: 123 },
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });

    it('should convert array to string', () => {
      const expected = '1,2,3';

      const info: WinstonInfo = {
        level: 'error',
        message: [1, 2, 3],
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });

    it('should convert boolean to string', () => {
      const expected = 'true';

      const info: WinstonInfo = {
        level: 'error',
        message: true,
        [SPLAT]: [],
      };

      const actual = extractMessageStep(info);

      expect(actual).toBe(expected);
    });
  });
});
