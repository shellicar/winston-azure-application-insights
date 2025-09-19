import type { ExceptionTelemetry, TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';

export interface ITelemetryClientV2 {
  trackTrace(telemetry: TraceTelemetry): void;
  trackException(telemetry: ExceptionTelemetry): void;
}
