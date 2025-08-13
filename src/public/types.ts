import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';
import type { Format } from 'logform';
import type { LoggerOptions } from 'winston';
import type { TelemetrySeverity } from './enums';

// public
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

export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}

export interface SeverityMapping {
  [level: string]: TelemetrySeverity;
}

export type IsError = (obj: unknown) => obj is Error;

export interface AzureApplicationInsightsLoggerOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping?: SeverityMapping;
  traceFilter?: ITraceTelemetryFilter;
  exceptionFilter?: IExceptionTelemetryFilter;
  isError?: IsError;
}

export type ITraceTelemetryFilter = (trace: TelemetryDataTrace) => boolean;
export type IExceptionTelemetryFilter = (exception: TelemetryDataException) => boolean;

export type CreateTelemetryHandlerOptions =
  | {
      client: TelemetryClientV2;
      version: 2;
    }
  | {
      client: TelemetryClientV3;
      version: 3;
    };

export type CreateApplicationInsightsTransportOptions = {
  severityMapping?: SeverityMapping;
  traceFilter?: ITraceTelemetryFilter;
  exceptionFilter?: IExceptionTelemetryFilter;
  isError?: IsError;
} & CreateTelemetryHandlerOptions;

export interface WinstonLevels {
  [levelName: string]: number;
}

export type CreateWinstonLoggerOptions = {
  winston: {
    console?: boolean;
    format?: Format[];
    defaultMeta?: Record<string, unknown>;
    level?: string;
    levels?: WinstonLevels;
    options?: Omit<LoggerOptions, 'format' | 'defaultMeta' | 'level' | 'levels'>;
  };
  insights: {
    severityMapping?: SeverityMapping;
  } & CreateTelemetryHandlerOptions;
};
