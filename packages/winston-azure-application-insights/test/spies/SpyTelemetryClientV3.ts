import { type ExceptionTelemetry, TelemetryClient, type TraceTelemetry } from 'applicationinsightsv3';
import { beforeEach } from 'vitest';

export class SpyTelemetryClientV3 extends TelemetryClient {
  public constructor() {
    super('InstrumentationKey=00000000-0000-0000-0000-000000000000');
    beforeEach(() => {
      this.clear();
    });
  }

  public traces: TraceTelemetry[] = [];
  public exceptions: ExceptionTelemetry[] = [];

  public clear() {
    this.traces.length = 0;
    this.exceptions.length = 0;
  }

  override trackTrace(telemetry: TraceTelemetry): void {
    console.log('SpyTelemetryClientV3.trackTrace', telemetry);
    this.traces.push(telemetry);
  }

  override trackException(telemetry: ExceptionTelemetry): void {
    this.exceptions.push(telemetry);
  }
}
