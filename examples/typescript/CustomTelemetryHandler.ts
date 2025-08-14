import type { TelemetryHandler } from '@shellicar/winston-azure-application-insights';
import type { TelemetryData } from '../../src/public/types';

export class CustomTelemetryHandler implements TelemetryHandler {
  handleTelemetry(telemetry: TelemetryData) {
    console.log('Custom Telemetry Handler:', telemetry);
  }
}
