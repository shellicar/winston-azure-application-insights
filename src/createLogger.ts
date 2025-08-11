import { config, createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from './ApplicationInsightsTransport';
import { ApplicationInsightsV2TelemetryHandler } from './ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from './ApplicationInsightsV3TelemetryHandler';
import type { CreateWinstonLoggerOptions, TelemetryHandler } from './types';

export const createWinstonLogger = (options: CreateWinstonLoggerOptions) => {
  const level = options.winston.level ?? 'info';
  const levels = options.winston.levels ?? config.npm.levels;

  const telemetryHandler: TelemetryHandler =
    options.insights.version === 2
      ? new ApplicationInsightsV2TelemetryHandler({
          client: options.insights.client,
          traceFilter: options.insights.traceFilter,
          exceptionFilter: options.insights.exceptionFilter,
        })
      : new ApplicationInsightsV3TelemetryHandler({
          client: options.insights.client,
          traceFilter: options.insights.traceFilter,
          exceptionFilter: options.insights.exceptionFilter,
        });

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    sendErrorsAsExceptions: options.insights.sendErrorsAsExceptions,
    severityMapping: options.insights.severityMapping,
  });

  const _transports: TransportStream[] = [transport];

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
