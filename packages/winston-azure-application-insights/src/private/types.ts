import { SPLAT } from 'triple-beam';
import type { IExceptionTelemetryFilter, IsError, ITraceTelemetryFilter, SeverityMapping, TelemetryHandler } from '../public/types';

// Utility type to make all properties of T optional and never
type MakeNever<T> = {
  [K in keyof T]?: never;
};

// Utility type to make specific properties optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface RequiredOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping: SeverityMapping;
  isError: IsError;
  traceFilter: ITraceTelemetryFilter;
  exceptionFilter: IExceptionTelemetryFilter;
}

export interface BaseWinstonInfo {
  level: string;
  [SPLAT]?: unknown[];
  [key: string]: unknown;
}

interface RegularWinstonInfo extends BaseWinstonInfo, MakeNever<Omit<Error, 'message'>> {
  message: unknown;
}
interface ErrorWinstonInfo extends BaseWinstonInfo, Optional<Error, 'name'> {}
export type WinstonInfo = RegularWinstonInfo | ErrorWinstonInfo;

export interface ApplicationInsightsTransportOptions {
  telemetryHandler: TelemetryHandler;
  severityMapping?: SeverityMapping;
  traceFilter?: ITraceTelemetryFilter;
  exceptionFilter?: IExceptionTelemetryFilter;
  isError?: IsError;
  level?: string;
}
