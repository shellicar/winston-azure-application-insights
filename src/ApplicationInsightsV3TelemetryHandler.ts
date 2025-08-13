import type { ExceptionTelemetry, TelemetryClient, TraceTelemetry } from 'applicationinsightsv3';
import { KnownSeverityLevel } from 'applicationinsightsv3';
import { TelemetrySeverity } from './enums';
import type { TelemetryData, TelemetryHandler } from './types';

export interface ApplicationInsightsV3TelemetryHandlerOptions {
  client: TelemetryClient;
  traceFilter?: (telemetry: TraceTelemetry) => boolean;
  exceptionFilter?: (exception: ExceptionTelemetry) => boolean;
}

export class ApplicationInsightsV3TelemetryHandler implements TelemetryHandler {
  private readonly client: TelemetryClient;
  private readonly severityMapping: Record<TelemetrySeverity, KnownSeverityLevel> = {
    [TelemetrySeverity.Verbose]: KnownSeverityLevel.Verbose,
    [TelemetrySeverity.Information]: KnownSeverityLevel.Information,
    [TelemetrySeverity.Warning]: KnownSeverityLevel.Warning,
    [TelemetrySeverity.Error]: KnownSeverityLevel.Error,
    [TelemetrySeverity.Critical]: KnownSeverityLevel.Critical,
  };
  private readonly traceFilter?: (telemetry: TraceTelemetry) => boolean;
  private readonly exceptionFilter?: (exception: ExceptionTelemetry) => boolean;

  constructor(options: ApplicationInsightsV3TelemetryHandlerOptions) {
    this.client = options.client;
    this.traceFilter = options.traceFilter;
    this.exceptionFilter = options.exceptionFilter;
  }

  public handleTelemetry(telemetry: TelemetryData): void {
    if (telemetry.trace != null) {
      const trace: TraceTelemetry = {
        message: telemetry.trace.message,
        severity: this.mapSeverity(telemetry.trace.severity),
        properties: telemetry.trace.properties,
      };
      if (this.traceFilter?.(trace) !== false) {
        this.client.trackTrace(trace);
      }
    }

    for (const error of telemetry.exceptions) {
      const exceptionTelemetry = {
        exception: error.exception,
        properties: error.properties,
      } satisfies ExceptionTelemetry;

      if (this.exceptionFilter?.(exceptionTelemetry) !== false) {
        this.client.trackException(exceptionTelemetry);
      }
    }
  }

  private mapSeverity(severity: TelemetrySeverity): KnownSeverityLevel {
    return this.severityMapping[severity];
  }
}
