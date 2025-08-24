import { TelemetryClient } from 'applicationinsightsv2';
import type { ExceptionTelemetry, TraceTelemetry } from 'applicationinsightsv2/out/Declarations/Contracts';

export class SpyTelemetryClientV2 extends TelemetryClient {
  public constructor() {
    super('InstrumentationKey=00000000-0000-0000-0000-000000000000');
  }

  public traces: TraceTelemetry[] = [];
  public exceptions: ExceptionTelemetry[] = [];

  public clear() {
    this.traces.length = 0;
    this.exceptions.length = 0;
  }

  override trackTrace(telemetry: TraceTelemetry): void {
    this.traces.push(telemetry);
  }

  override trackException(telemetry: ExceptionTelemetry): void {
    this.exceptions.push(telemetry);
  }
}
