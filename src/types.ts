import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';

export type PlainObject = Record<string, any>;

export type NodeClient = TelemetryClientV2 | TelemetryClientV3;

export type JsonValue = string | number | JsonObject | JsonValue[] | null;
export type JsonObject = {
  [key: string]: JsonValue;
};

export type AzureLogLevels = {
  [key: string]: LogLevel;
};

export enum LogLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

export type AzureInsightsClientOptions =
  | {
      version: 2;
      client: TelemetryClientV2;
      filters?: ITelemetryFilterV2[];
    }
  | {
      version: 3;
      client: TelemetryClientV3;
      filters?: ITelemetryFilterV3[];
    };

export type FilterTraceArgs = {
  message: string;
  severity: LogLevel;
  properties: PlainObject;
};

export type AzureApplicationInsightsLoggerOptionsBase = AzureInsightsClientOptions & {
  silent?: boolean;
  sendErrorsAsExceptions?: boolean;
};

export type AzureApplicationInsightsLoggerOptions = AzureApplicationInsightsLoggerOptionsBase & {
  defaultLevel?: string;
  levels?: AzureLogLevels;
};

export abstract class ITelemetryFilterV3 {
  public filterTrace(trace: TraceTelemetryV3, client: TelemetryClientV3): boolean {
    return true;
  }
  public filterException(trace: ExceptionTelemetryV3, client: TelemetryClientV3): boolean {
    return true;
  }
}
export abstract class ITelemetryFilterV2 {
  public filterTrace(trace: TraceTelemetryV2, client: TelemetryClientV2): boolean {
    return true;
  }
  public filterException(trace: ExceptionTelemetryV2, client: TelemetryClientV2): boolean {
    return true;
  }
}
