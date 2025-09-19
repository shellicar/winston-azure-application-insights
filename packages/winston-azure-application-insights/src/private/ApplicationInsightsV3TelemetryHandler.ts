import type { ExceptionTelemetry, TraceTelemetry } from 'applicationinsightsv3';
import { KnownSeverityLevel } from 'applicationinsightsv3';
import { TelemetrySeverity } from '../public/enums';
import type { ITelemetryClientV3 } from '../public/ITelemetryClientV3';
import type { TelemetryData, TelemetryHandler } from '../public/types';

export interface ApplicationInsightsV3TelemetryHandlerOptions {
  client: ITelemetryClientV3;
}

export class ApplicationInsightsV3TelemetryHandler implements TelemetryHandler {
  private readonly client: ITelemetryClientV3;
  private readonly severityMapping: Record<TelemetrySeverity, KnownSeverityLevel> = {
    [TelemetrySeverity.Verbose]: KnownSeverityLevel.Verbose,
    [TelemetrySeverity.Information]: KnownSeverityLevel.Information,
    [TelemetrySeverity.Warning]: KnownSeverityLevel.Warning,
    [TelemetrySeverity.Error]: KnownSeverityLevel.Error,
    [TelemetrySeverity.Critical]: KnownSeverityLevel.Critical,
  };

  constructor(options: ApplicationInsightsV3TelemetryHandlerOptions) {
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

  private mapSeverity(severity: TelemetrySeverity): KnownSeverityLevel {
    return this.severityMapping[severity];
  }
}
