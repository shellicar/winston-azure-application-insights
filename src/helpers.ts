import type { Format } from 'logform';
import { createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import { AzureApplicationInsightsLogger, type AzureApplicationInsightsLoggerOptions } from './winston-azure-application-insights';

export const isRunningInAzure = () => {
  return process.env.WEBSITE_INSTANCE_ID !== undefined;
};
export const isRunningLocally = () => {
  return !isRunningInAzure();
};

type JsonValue = string | number | JsonObject | JsonValue[] | null;
type JsonObject = {
  [key: string]: JsonValue;
};

export type CreateWinstonLoggerOptions = {
  insights: AzureApplicationInsightsLoggerOptions;
  winston: {
    defaultMeta?: JsonObject;
    console: boolean;
    format?: Format[];
  };
};

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
    format: _format,
    transports: _transports,
    defaultMeta: options.winston.defaultMeta,
  });
};
