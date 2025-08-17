import type TransportStream from 'winston-transport';
import { ApplicationInsightsTransport } from '../private/ApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import type { CreateApplicationInsightsTransportOptions } from './types';

export const createApplicationInsightsTransport = (options: CreateApplicationInsightsTransportOptions): TransportStream => {
  const telemetryHandler = createTelemetryHandler(options);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    severityMapping: options.severityMapping,
    exceptionFilter: options.exceptionFilter,
    traceFilter: options.traceFilter,
    isError: options.isError,
    level: options.level,
  });

  return transport;
};
