import { SPLAT } from 'triple-beam';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import { extractMessageStep } from '../src/extractMessageStep';
import type { WinstonInfo } from '../src/types';
import type { TelemetryData } from '../src/types';
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

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should extract different messages', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'goodbye universe',
      [SPLAT]: [{ message: 'universe' }],
    };

    const result = extractMessageStep(info);
    const actual = result.message;
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

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should extract number message property', () => {
    const expected = 'hello';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello 50',
      [SPLAT]: [{ message: 50 }],
    };

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should extract null message property', () => {
    const expected = 'Hello';

    const info: WinstonInfo = {
      level: 'info',
      message: expected,
      [SPLAT]: [{ message: null }],
    };

    const result = extractMessageStep(info);
    const actual = result.message;

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

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should return unchanged when no splat', () => {
    const expected = 'hello world';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello world',
    };

    const result = extractMessageStep(info);
    const actual = result.message;

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

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should handle Error as first parameter in splat', () => {
    const error = new Error('Database error');

    const info: WinstonInfo = {
      level: 'error',
      message: 'Error: Database error', // What Winston might generate
      [SPLAT]: [error],
    };

    const result = extractMessageStep(info);
    const actual = result.message;

    // TODO: Determine what the expected behavior should be
    console.log('Extract message result when Error is first param:', actual);
  });

  describe('Edge cases with non-string message', () => {
    it('should convert number to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: 42 as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('42');
    });

    it('should convert null to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: null as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('null');
    });

    it('should convert undefined to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: undefined as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('undefined');
    });

    it('should convert object to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: { foo: 'bar', baz: 123 } as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('[object Object]');
    });

    it('should convert array to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: [1, 2, 3] as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('1,2,3');
    });

    it('should convert boolean to string', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: true as any,
        [SPLAT]: [],
      };

      const result = extractMessageStep(info);

      expect(result.message).toBe('true');
    });
  });
});
