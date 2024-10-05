import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';

export type NodeClient = TelemetryClientV2 | TelemetryClientV3;

export type JsonValue = string | number | JsonObject | JsonValue[] | null;
export type JsonObject = {
  [key: string]: JsonValue;
};
