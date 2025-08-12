import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import type { Format } from 'logform';
import { splatSymbol } from './consts';
import type { TelemetrySeverity } from './enums';

export interface RequiredOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping: SeverityMapping;
  isError: (obj: unknown) => boolean;
}

export interface TelemetryDataTrace {
  message: string;
  properties: ExtractedProperties;
  severity: TelemetrySeverity;
}

export interface TelemetryData {
  trace: TelemetryDataTrace | null;
  errors: Error[];
}

export type ITelemetryFilterV2 = (telemetry: TraceTelemetryV2) => boolean;
export type ITelemetryFilterV3 = (telemetry: TraceTelemetryV3) => boolean;
export type IExceptionFilterV2 = (exception: ExceptionTelemetryV2) => boolean;
export type IExceptionFilterV3 = (exception: ExceptionTelemetryV3) => boolean;

export type TelemetryHandlerFactoryBaseOptions = {
  severityMapping?: SeverityMapping;
} & TelemetryHandlerFactoryOptions;

export type TelemetryHandlerFactoryOptions =
  | {
      client: TelemetryClientV2;
      version: 2;
      traceFilter?: ITelemetryFilterV2;
      exceptionFilter?: IExceptionFilterV2;
    }
  | {
      client: TelemetryClientV3;
      version: 3;
      traceFilter?: ITelemetryFilterV3;
      exceptionFilter?: IExceptionFilterV3;
    };

export type TelemetryHandlerFactory = (options: TelemetryHandlerFactoryOptions) => TelemetryHandler;

export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}

// Base Winston properties that are always present
interface BaseWinstonInfo {
  level: string;
  [splatSymbol]?: unknown[];
  [key: symbol]: unknown;
}

// For regular Winston info (most common case)
interface RegularWinstonInfo extends BaseWinstonInfo {
  message: string;
}

// For when an Error is passed as first parameter to logger
interface ErrorWinstonInfo extends BaseWinstonInfo, Error {
  // Error already has message, name, stack, etc.
}

// WinstonInfo can be either case
export type WinstonInfo = RegularWinstonInfo | ErrorWinstonInfo;

export interface SeverityMapping {
  [level: string]: TelemetrySeverity;
}

export interface AzureApplicationInsightsLoggerOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping?: SeverityMapping;
  isError?: (obj: unknown) => boolean;
}

export type CreateWinstonLoggerOptions = {
  winston: {
    console: boolean;
    format?: Format[];
    defaultMeta?: Record<string, unknown>;
    level?: string;
    levels?: WinstonLevels;
  };
  insights: {
    severityMapping?: SeverityMapping;
  } & TelemetryHandlerFactoryOptions;
};

export interface WinstonLevels {
  [levelName: string]: number;
}
export type ExtractedProperties = Record<string, unknown> | unknown[];
