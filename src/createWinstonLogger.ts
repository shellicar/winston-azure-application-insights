import { createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import type { CreateWinstonLoggerOptions } from './CreateWinstonLoggerOptions';
import { AzureApplicationInsightsLogger } from './winston-azure-application-insights';

const npmLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

export const createWinstonLogger = (options: CreateWinstonLoggerOptions) => {
  const level = options.winston.level ?? 'info';
  const levels = options.winston.levels ?? npmLevels;

  const _transports: TransportStream[] = [
    new AzureApplicationInsightsLogger({
      ...options.insights,
      defaultLevel: level,
    }),
  ];

  if (options.winston.console) {
    _transports.push(
      new transports.Console({
        format: format.json(),
        stderrLevels: ['error', 'crit', 'alert', 'emerg'],
        consoleWarnLevels: ['warn', 'warning'],
      }),
    );
  }

  const _format = format.combine(...(options.winston.format ?? []), format.json());

  return createLogger({
    level,
    levels,
    format: _format,
    transports: _transports,
    defaultMeta: options.winston.defaultMeta,
  });
};
