import winston from 'winston';
import type TransportStream from 'winston-transport';
import { type CreateWinstonFormatOptions, createWinstonFormat } from '../private/createWinstonFormat';
import { createApplicationInsightsTransport } from './createApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import { isRunningLocally } from './isRunningLocally';
import type { CreateWinstonLoggerOptions } from './types';

export const createWinstonLogger = (options: CreateWinstonLoggerOptions): winston.Logger => {
  const { severityMapping, exceptionFilter, traceFilter, isError, ...rest } = options.insights;

  const telemetryHandler = createTelemetryHandler(rest);

  const transports: TransportStream[] = [];

  const consoleEnabled = options.winston?.console?.enabled ?? isRunningLocally();
  if (consoleEnabled) {
    let consoleFormatConfig: CreateWinstonFormatOptions | undefined;

    if (Array.isArray(options.winston?.console?.format)) {
      consoleFormatConfig = options.winston.console.format;
    } else {
      const userFormat = options.winston?.console?.format ?? {};
      consoleFormatConfig = {
        output: userFormat.output ?? 'json',
        timestamp: userFormat.timestamp ?? true,
        errors: userFormat.errors ?? { stack: true },
        colorize: userFormat.colorize ?? true,
      };
    }

    const consoleFormat = createWinstonFormat(consoleFormatConfig);

    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: options.winston?.console?.level,
        stderrLevels: ['error', 'crit', 'alert', 'emerg'],
        consoleWarnLevels: ['warn', 'warning'],
      }),
    );
  }

  // Insights transport
  const insightsEnabled = options.winston?.insights?.enabled ?? true;
  if (insightsEnabled) {
    const transport = createApplicationInsightsTransport({
      telemetryHandler,
      severityMapping,
      exceptionFilter,
      traceFilter,
      isError,
      level: options.winston?.insights?.level,
    });
    transports.push(transport);
  }

  // Merge defaults with logger-level options
  const level = options.winston?.defaults?.level ?? 'info';
  const levels = options.winston?.levels ?? winston.config.npm.levels;
  const globalFormats = options.winston?.defaults?.format ?? [];

  const format = winston.format.combine(...globalFormats);

  return winston.createLogger({
    ...options.winston?.options,
    level,
    levels,
    format,
    transports,
    defaultMeta: options.winston?.defaults?.defaultMeta,
  });
};
