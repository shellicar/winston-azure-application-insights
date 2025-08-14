import { ApplicationInsightsV2TelemetryHandler } from '../private/ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from '../private/ApplicationInsightsV3TelemetryHandler';
import type { CreateTelemetryHandlerOptions, TelemetryHandler } from './types';

export const createTelemetryHandler = (options: CreateTelemetryHandlerOptions): TelemetryHandler => {
  switch (options.version) {
    case 2: {
      return new ApplicationInsightsV2TelemetryHandler({
        client: options.client,
      });
    }
    case 3: {
      return new ApplicationInsightsV3TelemetryHandler({
        client: options.client,
      });
    }
    default: {
      return options.handler;
    }
  }
};
