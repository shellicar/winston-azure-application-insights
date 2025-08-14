import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';
import type { ColorizeOptions, Format, TimestampOptions } from 'logform';
import type { LoggerOptions } from 'winston';
import type { TelemetrySeverity } from './enums';
import { isRunningLocally } from './isRunningLocally';

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
    }
  | {
      handler: TelemetryHandler;
      version?: never;
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

export interface WinstonColors {
  [colorName: string]: string;
}

export interface WinstonTransportOptions {
  enabled?: boolean;
  format?:
    | Format[]
    | {
        output?: 'json' | 'simple';
        errors?: boolean | { stack?: boolean };
        timestamp?: boolean | TimestampOptions;
        colorize?: boolean | ColorizeOptions;
      };
  level?: string;
  defaultMeta?: Record<string, unknown>;
}

export type CreateWinstonLoggerOptions = {
  winston?: {
    levels?: WinstonLevels;
    colors?: WinstonColors;
    options?: Omit<LoggerOptions, 'format' | 'defaultMeta' | 'level' | 'levels'>;
    defaults?: Omit<WinstonTransportOptions, 'enabled' | 'format'>;
    console?: WinstonTransportOptions;
    insights?: Omit<WinstonTransportOptions, 'format'>;
  };
  insights: CreateApplicationInsightsTransportOptions;
};
