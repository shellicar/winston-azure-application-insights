import type { TelemetryClient } from 'applicationinsightsv2';
import { type ExceptionTelemetry, SeverityLevel, type TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';
import { TelemetrySeverity } from './enums';
import type { TelemetryData, TelemetryHandler } from './types';

export interface ApplicationInsightsV2TelemetryHandlerOptions {
  client: TelemetryClient;
  traceFilter?: (telemetry: TraceTelemetry) => boolean;
  exceptionFilter?: (exception: ExceptionTelemetry) => boolean;
}

export class ApplicationInsightsV2TelemetryHandler implements TelemetryHandler {
  private readonly client: TelemetryClient;
  private readonly traceFilter?: (telemetry: TraceTelemetry) => boolean;
  private readonly exceptionFilter?: (exception: ExceptionTelemetry) => boolean;
  private readonly severityMapping: Record<TelemetrySeverity, SeverityLevel> = {
    [TelemetrySeverity.Verbose]: SeverityLevel.Verbose,
    [TelemetrySeverity.Information]: SeverityLevel.Information,
    [TelemetrySeverity.Warning]: SeverityLevel.Warning,
    [TelemetrySeverity.Error]: SeverityLevel.Error,
    [TelemetrySeverity.Critical]: SeverityLevel.Critical,
  };

  constructor(options: ApplicationInsightsV2TelemetryHandlerOptions) {
    this.client = options.client;
    this.traceFilter = options.traceFilter;
    this.exceptionFilter = options.exceptionFilter;
  }

  public handleTelemetry(telemetry: TelemetryData): void {
    const trace: TraceTelemetry = {
      message: telemetry.message,
      severity: this.mapSeverity(telemetry.severity),
      properties: telemetry.properties,
    };
    if (this.traceFilter?.(trace) !== false) {
      this.client.trackTrace(trace);
    }

    for (const error of telemetry.errors) {
      const exceptionTelemetry = {
        exception: error,
      };

      if (this.exceptionFilter?.(exceptionTelemetry) !== false) {
        this.client.trackException(exceptionTelemetry);
      }
    }
  }

  private mapSeverity(severity: TelemetrySeverity): SeverityLevel {
    return this.severityMapping[severity];
  }
}
