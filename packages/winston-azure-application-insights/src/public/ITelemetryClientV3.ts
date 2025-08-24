import type { ExceptionTelemetry, TraceTelemetry } from 'applicationinsightsv3';

export interface ITelemetryClientV3 {
  trackTrace(telemetry: TraceTelemetry): void;
  trackException(telemetry: ExceptionTelemetry): void;
}
