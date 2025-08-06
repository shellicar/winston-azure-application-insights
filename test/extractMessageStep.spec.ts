import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/ApplicationInsightsTransport';
import { splatSymbol } from '../src/consts';
import { extractMessageStep } from '../src/extractMessageStep';
import type { WinstonInfo } from '../src/types';
import type { TelemetryData } from '../src/types';

const telemetryHandler = {
  telemetry: { message: '' } as TelemetryData | undefined,
  handleTelemetry: (telemetry: TelemetryData) => {
    telemetryHandler.telemetry = telemetry;
  },
  clear() {
    this.telemetry = undefined;
  },
};

describe('extractMessageStep', () => {
  beforeEach(() => {
    telemetryHandler.clear();
  });

  it('should extract winston message in pipeline step', () => {
    const expected = 'hello';

    const info: WinstonInfo = {
      level: 'info',
      message: 'hello world',
      [splatSymbol]: [{ message: 'world' }],
    };

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });

  it('should extract different messages', () => {
    const info: WinstonInfo = {
      level: 'info',
      message: 'goodbye universe',
      [splatSymbol]: [{ message: 'universe' }],
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
      [splatSymbol]: [{ message: { x: '5' } }],
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
      [splatSymbol]: [{ message: 50 }],
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
      [splatSymbol]: [{ message: null }],
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

    const winstonResult = telemetryHandler.telemetry!.message;

    const info: WinstonInfo = {
      level: 'info',
      message: winstonResult,
      [splatSymbol]: [meta],
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

    const winstonResult = telemetryHandler.telemetry!.message;

    const info: WinstonInfo = {
      level: 'error',
      message: winstonResult,
      [splatSymbol]: [new Error('2'), new Error('3')],
    };

    const result = extractMessageStep(info);
    const actual = result.message;

    expect(actual).toBe(expected);
  });
});
