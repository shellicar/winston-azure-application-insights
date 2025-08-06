import type { TelemetryClient } from 'applicationinsightsv2';
import { SeverityLevel } from 'applicationinsightsv2/out/Declarations/Contracts';
import { TelemetrySeverity } from './enums';
import type { TelemetryData, TelemetryHandler } from './types';

export interface ApplicationInsightsV2TelemetryHandlerOptions {
  client: TelemetryClient;
}

export class ApplicationInsightsV2TelemetryHandler implements TelemetryHandler {
  private readonly client: TelemetryClient;
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
    this.client.trackTrace({
      message: telemetry.message,
      severity: this.mapSeverity(telemetry.severity),
      properties: telemetry.properties,
    });

    for (const error of telemetry.errors) {
      this.client.trackException({
        exception: error,
        properties: telemetry.properties,
      });
    }
  }

  private mapSeverity(severity: TelemetrySeverity): SeverityLevel {
    return this.severityMapping[severity];
  }
}
