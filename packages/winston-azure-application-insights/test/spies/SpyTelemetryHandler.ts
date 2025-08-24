import { beforeEach } from 'node:test';
import type { TelemetryHandler } from '../../src';
import type { TelemetryData } from '../../src/public/types';

export class SpyTelemetryHandler implements TelemetryHandler {
  public telemetry: TelemetryData | undefined;

  constructor() {
    beforeEach(() => {
      this.clear();
    });
  }

  handleTelemetry(telemetry: TelemetryData): void {
    this.telemetry = telemetry;
  }

  clear() {
    this.telemetry = undefined;
  }
}
