import type { ColorizeOptions, Format, TimestampOptions, TransformableInfo } from 'logform';
import { MESSAGE } from 'triple-beam';
import winston from 'winston';

/**
 * Converts escaped ANSI color codes back to actual ANSI escape sequences.
 * Specifically converts `\\u001b` (escaped) to `\u001b` (ESC character, ^[ or 0x1B).
 * @see https://github.com/winstonjs/logform#colorize
 */
const unescapeColorCodes = (info: TransformableInfo) => {
  const message = info[MESSAGE] as string;
  return message.replaceAll(/\\u001b/g, '\u001b');
};

const unescapeColorCodesFormat = () => winston.format.printf(unescapeColorCodes);

export type CreateWinstonFormatOptions =
  | Format[]
  | {
      output: 'json' | 'simple';
      errors: boolean | { stack?: boolean };
      timestamp: boolean | TimestampOptions;
      colorize: boolean | ColorizeOptions;
    };

export const createWinstonFormat = (config: CreateWinstonFormatOptions): Format => {
  if (Array.isArray(config)) {
    return winston.format.combine(...config);
  }

  const formats: Format[] = [];

  if (config.timestamp === true) {
    formats.push(winston.format.timestamp());
  } else if (typeof config.timestamp === 'object') {
    formats.push(winston.format.timestamp(config.timestamp));
  }

  if (config.errors === true) {
    formats.push(winston.format.errors({ stack: true }));
  } else if (typeof config.errors === 'object') {
    formats.push(winston.format.errors(config.errors));
  }

  if (config.colorize === true) {
    formats.push(winston.format.colorize({ all: true }));
  } else if (typeof config.colorize === 'object') {
    formats.push(winston.format.colorize(config.colorize));
  }

  if (config.output === 'simple') {
    formats.push(winston.format.simple());
  }
  if (config.output === 'json') {
    formats.push(winston.format.json());

    if (config.colorize === true || typeof config.colorize === 'object') {
      formats.push(unescapeColorCodesFormat());
    }
  }

  return winston.format.combine(...formats);
};
