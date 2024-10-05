import { createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import type { CreateWinstonLoggerOptions } from './CreateWinstonLoggerOptions';
import { AzureApplicationInsightsLogger } from './winston-azure-application-insights';

export const createWinstonLogger = (options: CreateWinstonLoggerOptions) => {
  const _transports: TransportStream[] = [new AzureApplicationInsightsLogger(options.insights)];

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
    level: options.winston.level,
    format: _format,
    transports: _transports,
    defaultMeta: options.winston.defaultMeta,
  });
};
