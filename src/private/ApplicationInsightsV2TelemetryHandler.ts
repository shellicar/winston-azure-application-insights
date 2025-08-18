import type { ExceptionTelemetry, TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';
import { TelemetrySeverity } from '../public/enums';
import type { ITelemetryClientV2 } from '../public/ITelemetryClientV2';
import type { TelemetryData, TelemetryHandler } from '../public/types';

// From application insights
// Declare locally to avoid importing the library
enum SeverityLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

export interface ApplicationInsightsV2TelemetryHandlerOptions {
  client: ITelemetryClientV2;
}

export class ApplicationInsightsV2TelemetryHandler implements TelemetryHandler {
  private readonly client: ITelemetryClientV2;
  private readonly severityMapping: Record<TelemetrySeverity, SeverityLevel> = {
    [TelemetrySeverity.Verbose]: SeverityLevel.Verbose,
    [TelemetrySeverity.Information]: SeverityLevel.Information,
    [TelemetrySeverity.Warning]: SeverityLevel.Warning,
    [TelemetrySeverity.Error]: SeverityLevel.Error,
    [TelemetrySeverity.Critical]: SeverityLevel.Critical,
  };

  constructor(options: ApplicationInsightsV2TelemetryHandlerOptions) {
    this.client = options.client;
  }

  public handleTelemetry(telemetry: TelemetryData): void {
    if (telemetry.trace != null) {
      const trace: TraceTelemetry = {
        message: telemetry.trace.message,
        severity: this.mapSeverity(telemetry.trace.severity),
        properties: telemetry.trace.properties,
      };
      this.client.trackTrace(trace);
    }

    for (const error of telemetry.exceptions) {
      const exceptionTelemetry = {
        exception: error.exception,
        properties: error.properties,
      } satisfies ExceptionTelemetry;

      this.client.trackException(exceptionTelemetry);
    }
  }

  private mapSeverity(severity: TelemetrySeverity): SeverityLevel {
    return this.severityMapping[severity];
  }
}
