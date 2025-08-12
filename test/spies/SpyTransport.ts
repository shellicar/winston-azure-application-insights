import { beforeEach } from 'vitest';
import type { TelemetryHandler } from '../../src';
import type { TelemetryData } from '../../src/types';

/**
 * Spy TelemetryHandler for testing ApplicationInsightsTransport
 */
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

  // Convenience getters
  get properties() {
    return this.telemetry?.trace?.properties ?? {};
  }

  get errors() {
    return this.telemetry?.errors ?? [];
  }

  get trace() {
    return this.telemetry?.trace;
  }

  get message() {
    return this.telemetry?.trace?.message;
  }

  clear() {
    this.telemetry = undefined;
  }
}
