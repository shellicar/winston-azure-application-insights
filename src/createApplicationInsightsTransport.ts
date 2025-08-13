import { ApplicationInsightsTransport } from './ApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import type { CreateApplicationInsightsTransportOptions } from './types';

export const createApplicationInsightsTransport = (options: CreateApplicationInsightsTransportOptions) => {
  const telemetryHandler = createTelemetryHandler(options);

  const transport = new ApplicationInsightsTransport({
    telemetryHandler,
    severityMapping: options.severityMapping,
  });

  return transport;
};
