import { ApplicationInsightsV2TelemetryHandler } from '../private/ApplicationInsightsV2TelemetryHandler';
import { ApplicationInsightsV3TelemetryHandler } from '../private/ApplicationInsightsV3TelemetryHandler';
import { ApplicationInsightsVersion } from './enums';
import type { CreateTelemetryHandlerOptions, TelemetryHandler } from './types';

export const createTelemetryHandler = (options: CreateTelemetryHandlerOptions): TelemetryHandler => {
  switch (options.version) {
    case ApplicationInsightsVersion.V2: {
      return new ApplicationInsightsV2TelemetryHandler({
        client: options.client,
      });
    }
    case ApplicationInsightsVersion.V3: {
      return new ApplicationInsightsV3TelemetryHandler({
        client: options.client,
      });
    }
    default: {
      return options.telemetryHandler;
    }
  }
};
