import type { ColorizeOptions, Format, TimestampOptions } from 'logform';
import winston from 'winston';

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
    formats.push(winston.format.colorize());
  } else if (typeof config.colorize === 'object') {
    formats.push(winston.format.colorize(config.colorize));
  }

  const formatter = config.output === 'simple' ? winston.format.simple() : winston.format.json();
  formats.push(formatter);

  return winston.format.combine(...formats);
};
