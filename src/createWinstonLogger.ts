import { config, createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from './ApplicationInsightsTransport';
import { ApplicationInsightsV2TelemetryHandler } from './ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from './ApplicationInsightsV3TelemetryHandler';
import type { CreateWinstonLoggerOptions, TelemetryHandler, TelemetryHandlerFactoryBaseOptions, TelemetryHandlerFactoryOptions } from './types';

export const createTelemetryHandler = (options: TelemetryHandlerFactoryOptions): TelemetryHandler => {
  switch (options.version) {
    case 2: {
      return new ApplicationInsightsV2TelemetryHandler({
        client: options.client,
        traceFilter: options.traceFilter,
        exceptionFilter: options.exceptionFilter,
      });
    }
    case 3: {
      return new ApplicationInsightsV3TelemetryHandler({
        client: options.client,
        traceFilter: options.traceFilter,
        exceptionFilter: options.exceptionFilter,
      });
    }
  }
};

export const createApplicationInsightsTransport = (options: TelemetryHandlerFactoryBaseOptions) => {
  const telemetryHandler = createTelemetryHandler(options);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    severityMapping: options.severityMapping,
  });

  return transport;
};

export const createWinstonLogger = (options: CreateWinstonLoggerOptions) => {
  const level = options.winston.level ?? 'info';
  const levels = options.winston.levels ?? config.npm.levels;

  const telemetryHandler = createTelemetryHandler(options.insights);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
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
