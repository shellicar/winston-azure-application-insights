import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import type { Format } from 'logform';
import { SPLAT } from 'triple-beam';
import type { LoggerOptions } from 'winston';
import type { TelemetrySeverity } from './enums';

export type IsError = (obj: unknown) => obj is Error;

export interface RequiredOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping: SeverityMapping;
  isError: IsError;
}

export type TelemetryDataProperties = Record<string, unknown>;

export interface TelemetryDataTrace {
  message: string;
  properties: TelemetryDataProperties;
  severity: TelemetrySeverity;
}

export interface TelemetryDataException {
  exception: Error;
  properties: TelemetryDataProperties;
}

export interface TelemetryData {
  trace: TelemetryDataTrace | null;
  exceptions: TelemetryDataException[];
}

export type ITelemetryFilterV2 = (telemetry: TraceTelemetryV2) => boolean;
export type ITelemetryFilterV3 = (telemetry: TraceTelemetryV3) => boolean;
export type IExceptionFilterV2 = (exception: ExceptionTelemetryV2) => boolean;
export type IExceptionFilterV3 = (exception: ExceptionTelemetryV3) => boolean;

export type CreateApplicationInsightsTransportOptions = {
  severityMapping?: SeverityMapping;
} & CreateTelemetryHandlerOptions;

export type CreateTelemetryHandlerOptions =
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

export type TelemetryHandlerFactory = (options: CreateTelemetryHandlerOptions) => TelemetryHandler;

export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}

type JsonValue = string | number | JsonObject | JsonValue[] | null;
type JsonObject = {
  [key: string]: JsonValue;
};

// Utility type to make all properties of T optional and never
type MakeNever<T> = {
  [K in keyof T]?: never;
};

// Utility type to make specific properties optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface BaseWinstonInfo {
  level: string;
  [SPLAT]?: unknown[];
  [key: string]: unknown;
}

export interface RegularWinstonInfo extends BaseWinstonInfo, MakeNever<Omit<Error, 'message'>> {
  message: unknown;
}
export interface ErrorWinstonInfo extends BaseWinstonInfo, Optional<Error, 'name'> {}
export type WinstonInfo = RegularWinstonInfo | ErrorWinstonInfo;

export interface SeverityMapping {
  [level: string]: TelemetrySeverity;
}

export interface AzureApplicationInsightsLoggerOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping?: SeverityMapping;
  isError?: IsError;
}

export type CreateWinstonLoggerOptions = {
  winston: {
    console?: boolean;
    format?: Format[];
    defaultMeta?: Record<string, unknown>;
    level?: string;
    levels?: WinstonLevels;
    options: Omit<LoggerOptions, 'format' | 'defaultMeta' | 'level' | 'levels'>;
  };
  insights: {
    severityMapping?: SeverityMapping;
  } & CreateTelemetryHandlerOptions;
};

export interface WinstonLevels {
  [levelName: string]: number;
}
