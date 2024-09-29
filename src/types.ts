import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';

export type NodeClient = TelemetryClientV2 | TelemetryClientV3;
