import type { Format, TransformableInfo } from 'logform';
import { MESSAGE, SPLAT } from 'triple-beam';
import { describe, expect, it, vi } from 'vitest';
import winston from 'winston';
import TransportStream from 'winston-transport';
import { type CreateWinstonFormatOptions, createWinstonFormat } from '../src/private/createWinstonFormat';
import type { WinstonInfo } from '../src/private/types';
import { createWinstonInfoFromErrorOnly } from './createWinstonInfoFromErrorOnly';

const ansiColor = (code: number, text: string) => `\u001b[${code}m${text}\u001b[39m`;

const transformInfo = (format: Format, info: WinstonInfo) => {
  console.log('Format', format, format.options);
  const result = format.transform(info as TransformableInfo) as TransformableInfo;
  const actual = result[MESSAGE];
  return actual;
};

const defaultFormatConfig: CreateWinstonFormatOptions = {
  output: 'json',
  errors: true,
  timestamp: false,
  colorize: false,
};

describe('createWinstonFormat', () => {
  it('empty transform does not set message', () => {
    const format = createWinstonFormat([]);
    const info = { level: 'info', message: 'Test' };

    const actual = transformInfo(format, info);

    expect(actual).toBeUndefined();
  });

  it('json transform stringifies', () => {
    const format = createWinstonFormat([winston.format.json()]);

    const info = { level: 'info', message: 'Test' };

    const actual = transformInfo(format, info);

    const expected = JSON.stringify(info);

    expect(actual).toBe(expected);
  });

  it('config with errors: true writes error stack', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, errors: true });

    const error = new Error('Test error');

    const info = createWinstonInfoFromErrorOnly(error, {
      level: 'error',
    });

    const actual = transformInfo(format, info);

    const expected = JSON.stringify({
      level: 'error',
      message: 'Test error',
      stack: error.stack,
    });

    expect(actual).toEqual(expected);
  });

  it('config with errors: { stack: false } does not write stack', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, errors: { stack: false } });

    const error = new Error('Test error');

    const info = createWinstonInfoFromErrorOnly(error, {
      level: 'error',
    });

    const actual = transformInfo(format, info);

    // Should have error message but no stack
    const expected = JSON.stringify({
      level: 'error',
      message: 'Test error',
    });

    expect(actual).toEqual(expected);
  });

  it('config with errors: { stack: true } writes error stack', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, errors: { stack: true } });

    const error = new Error('Test error');

    const info = createWinstonInfoFromErrorOnly(error, {
      level: 'error',
    });

    const actual = transformInfo(format, info);

    const expected = JSON.stringify({
      level: 'error',
      message: 'Test error',
      stack: error.stack,
    });

    expect(actual).toEqual(expected);
  });

  it('config with errors: false does not write stack', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, errors: false });

    const error = new Error('Test error');

    const info = createWinstonInfoFromErrorOnly(error, {
      level: 'error',
    });

    const actual = transformInfo(format, info);
    const expected = JSON.stringify(info);

    expect(actual).toEqual(expected);
  });

  it('config with json: false does not stringify', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, output: 'simple' });

    const info = { level: 'info', message: 'Test' };

    const actual = transformInfo(format, info);
    const expected = 'info: Test';

    expect(actual).toBe(expected);
  });

  it('config with timestamp: true includes timestamp', () => {
    const fakeDate = '2023-02-01T12:34:56.789Z';

    vi.useFakeTimers();
    vi.setSystemTime(new Date(fakeDate));

    const format = createWinstonFormat({ ...defaultFormatConfig, timestamp: true });
    const info = { level: 'info', message: 'Test' };

    const actual = transformInfo(format, info);
    const expected = JSON.stringify({
      level: 'info',
      message: 'Test',
      timestamp: fakeDate,
    });

    vi.useRealTimers();

    expect(actual).toEqual(expected);
  });

  it('config with timestamp: false excludes timestamp', () => {
    const format = createWinstonFormat({ ...defaultFormatConfig, timestamp: false });
    const info = { level: 'info', message: 'Test' };

    const actual = transformInfo(format, info);
    const expected = JSON.stringify({
      level: 'info',
      message: 'Test',
    });

    expect(actual).toEqual(expected);
  });

  it('config with colorize: true includes colorization', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      format: createWinstonFormat({ ...defaultFormatConfig, colorize: true }),
      transports: [new TestTransport()],
      level: 'info',
    });

    logger.info('Test');
    const actual = capturedInfo?.[MESSAGE];
    const expected = `{"level":"${ansiColor(32, 'info')}","message":"${ansiColor(32, 'Test')}"}`;

    expect(actual).toBe(expected);
  });

  it('config with colorize: false excludes colorization', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      format: createWinstonFormat({ ...defaultFormatConfig, colorize: false }),
      transports: [new TestTransport()],
      level: 'info',
    });

    logger.info('Test');
    const actual = capturedInfo?.[MESSAGE];

    const expected = JSON.stringify({
      level: 'info',
      message: 'Test',
    });
    expect(actual).toEqual(expected);
  });

  it('explicit splat format interpolates message', () => {
    const format = createWinstonFormat([winston.format.splat(), winston.format.json()]);
    const info = {
      level: 'info',
      message: 'Test %s',
      [Symbol.for('splat')]: ['world'],
    };

    const actual = transformInfo(format, info);

    const expected = JSON.stringify({
      level: 'info',
      message: 'Test world',
    });

    expect(actual).toEqual(expected);
  });

  it('winston logger automatically includes splat processing', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      transports: [
        new TestTransport(),
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize({ all: true }), winston.format.simple()),
        }),
      ],
      level: 'info',
    });

    logger.info('Test message', { extra: 'data' }, 'another param');
    const actual = capturedInfo?.[SPLAT];
    const expected = [{ extra: 'data' }, 'another param'];

    expect(actual).toEqual(expected);
  });

  it('custom timestamp options are applied', () => {
    const format = createWinstonFormat({
      output: 'json',
      errors: true,
      timestamp: { format: 'YYYY-MM-DD' },
      colorize: false,
    });
    const info = { level: 'info', message: 'Test' };
    const actual = transformInfo(format, info);
    // Should match custom format (simulate date for test)
    expect(actual).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('custom colorize options are applied', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      format: createWinstonFormat({
        output: 'json',
        errors: true,
        timestamp: false,
        colorize: { all: true },
      }),
      transports: [new TestTransport()],
      level: 'info',
    });

    logger.info('Test');
    const actual = capturedInfo?.[MESSAGE];
    const expected = `{"level":"${ansiColor(32, 'info')}","message":"${ansiColor(32, 'Test')}"}`;

    expect(actual).toBe(expected);
  });

  it('colorize comes after json format', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      format: createWinstonFormat({
        output: 'json',
        errors: true,
        timestamp: false,
        colorize: { all: true },
      }),
      transports: [new TestTransport()],
      level: 'info',
    });

    logger.info('Test message');
    const actual = capturedInfo?.[MESSAGE];
    const expected = `{"level":"${ansiColor(32, 'info')}","message":"${ansiColor(32, 'Test message')}"}`;

    expect(actual).toEqual(expected);
  });

  it('colorize come before simple format', () => {
    let capturedInfo: TransformableInfo | undefined;

    class TestTransport extends TransportStream {
      log(info: TransformableInfo, callback: any) {
        capturedInfo = info;
        callback();
      }
    }

    const logger = winston.createLogger({
      format: createWinstonFormat({
        output: 'simple',
        errors: true,
        timestamp: false,
        colorize: true,
      }),
      transports: [new TestTransport()],
      level: 'info',
    });

    logger.info('Test message');
    const actual = capturedInfo?.[MESSAGE];
    const expected = '\u001b[32minfo\u001b[39m: \u001b[32mTest message\u001b[39m';
    expect(actual).toBe(expected);
  });
});
