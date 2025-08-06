import { splatSymbol } from './consts';
import type { TelemetrySeverity } from './enums';

export interface RequiredOptions {
  telemetryHandler: TelemetryHandler;
  sendErrorsAsExceptions: boolean;
  severityMapping: SeverityMapping;
}
export interface TelemetryData {
  message: string;
  properties: ExtractedProperties;
  errors: Error[];
  severity: TelemetrySeverity;
}
export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}
export interface WinstonInfo {
  level: string;
  message: string;
  [splatSymbol]?: unknown[];
  [key: string]: unknown;
  [key: symbol]: unknown;
}
export interface SeverityMapping {
  [level: string]: TelemetrySeverity;
}
export interface ConstructorOptions {
  telemetryHandler: TelemetryHandler;
  sendErrorsAsExceptions?: boolean;
  severityMapping?: SeverityMapping;
}
export interface WinstonLevels {
  [levelName: string]: number;
}
export type SplatFilter = (item: unknown) => boolean;
export type ExtractedProperties = Record<string, unknown> | unknown[];
