import { config, createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from '../private/ApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import { isRunningLocally } from './isRunningLocally';
import type { CreateWinstonLoggerOptions } from './types';

export const createWinstonLogger = (options: CreateWinstonLoggerOptions) => {
  const telemetryHandler = createTelemetryHandler(options.insights);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    severityMapping: options.insights.severityMapping,
  });

  const _transports: TransportStream[] = [transport];

  const console = options.winston.console ?? isRunningLocally();

  if (console) {
    _transports.push(
      new transports.Console({
        format: format.json(),
        stderrLevels: ['error', 'crit', 'alert', 'emerg'],
        consoleWarnLevels: ['warn', 'warning'],
      }),
    );
  }

  const level = options.winston.level ?? 'info';
  const levels = options.winston.levels ?? config.npm.levels;
  const fmt = options.winston.format ?? [];
  const _format = format.combine(...fmt, format.json());

  return createLogger({
    ...options.winston.options,
    level,
    levels,
    format: _format,
    transports: _transports,
    defaultMeta: options.winston.defaultMeta,
  });
};
