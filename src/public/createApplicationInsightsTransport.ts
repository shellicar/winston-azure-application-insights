import { ApplicationInsightsTransport } from '../private/ApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import type { CreateApplicationInsightsTransportOptions } from './types';

export const createApplicationInsightsTransport = (options: CreateApplicationInsightsTransportOptions) => {
  const telemetryHandler = createTelemetryHandler(options);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    severityMapping: options.severityMapping,
    exceptionFilter: options.exceptionFilter,
    traceFilter: options.traceFilter,
    isError: options.isError,
  });

  return transport;
};
