import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, SeverityLevel as KnownSeverityLevelV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, KnownSeverityLevel as KnownSeverityLevelV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import TransportStream from 'winston-transport';
import { isRunningLocally } from '../isRunningLocally';
import { defaultLogLevels } from './defaultLogLevels';
import { type AzureApplicationInsightsLoggerOptions, type ITelemetryFilterV2, type ITelemetryFilterV3, LogLevel, type PlainObject } from './types';

const severityLevels = {
  v2: {
    [LogLevel.Verbose]: 0,
    [LogLevel.Information]: 1,
    [LogLevel.Warning]: 2,
    [LogLevel.Error]: 3,
    [LogLevel.Critical]: 4,
  } satisfies Record<LogLevel, KnownSeverityLevelV2>,
  v3: {
    [LogLevel.Verbose]: 'Verbose' as KnownSeverityLevelV3,
    [LogLevel.Information]: 'Information' as KnownSeverityLevelV3,
    [LogLevel.Warning]: 'Warning' as KnownSeverityLevelV3,
    [LogLevel.Error]: 'Error' as KnownSeverityLevelV3,
    [LogLevel.Critical]: 'Critical' as KnownSeverityLevelV3,
  } satisfies Record<LogLevel, KnownSeverityLevelV3>,
};

const isErrorLike = (obj: unknown): obj is Error => {
  if (obj instanceof Error) {
    return true;
  }

  if (obj != null && typeof obj === 'object') {
    const errorObj = obj as Record<string, unknown>;
    return typeof errorObj.message === 'string' && typeof errorObj.stack === 'string' && typeof errorObj.name === 'string';
  }

  return false;
};

const isPlainObject = (obj: unknown): obj is PlainObject => {
  return obj !== null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
};

export const makeSerializable = (obj: unknown): unknown => {
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }

  if (isErrorLike(obj)) {
    return {
      message: obj.message,
      name: obj.name,
      stack: obj.stack,
      ...Object.fromEntries(Object.entries(obj).filter(([key]) => key !== 'stack')),
    };
  }
  if (obj instanceof Date) {
    return obj;
  }

  if (isPlainObject(obj)) {
    return obj;
  }

  return { ...obj };
};

const extractPropsFromInfo = (info: PlainObject): PlainObject => {
  const exclude = ['level', 'message'];

  return Object.keys(info)
    .filter((key) => !exclude.includes(key))
    .reduce<PlainObject>((props, key) => {
      props[key] = makeSerializable(info[key]);
      return props;
    }, {});
};

const extractErrorPropsForTrace = (errorLike: Error): PlainObject => {
  const properties: PlainObject = {
    message: errorLike.message,
  };
  for (const [key, value] of Object.entries(errorLike)) {
    if (key !== 'stack' && Object.prototype.hasOwnProperty.call(errorLike, key)) {
      properties[key] = makeSerializable(value);
    }
  }
  return properties;
};

export class AzureApplicationInsightsLogger extends TransportStream {
  public sendErrorsAsExceptions: boolean;
  readonly name: string;
  private readonly warnOnMessageProperty: boolean;

  public get client(): TelemetryClientV3 | TelemetryClientV2 {
    return this.options.client;
  }

  constructor(private readonly options: AzureApplicationInsightsLoggerOptions) {
    super({ level: options.defaultLevel ?? 'info', silent: options.silent ?? false });
    this.name = 'applicationinsightslogger';
    this.sendErrorsAsExceptions = options.sendErrorsAsExceptions ?? true;
    this.warnOnMessageProperty = options.warnOnMessageProperty ?? isRunningLocally();
  }

  private handleTrace(severity: LogLevel, info: PlainObject, message: string | undefined, logMeta: PlainObject): void {
    const traceProps = extractPropsFromInfo(info);

    if (isErrorLike(info)) {
      Object.assign(traceProps, extractErrorPropsForTrace(info));
    }

    Object.assign(traceProps, logMeta);

    if (this.options.version === 3) {
      const telemetry: TraceTelemetryV3 = {
        message: String(message),
        severity: severityLevels.v3[severity],
        properties: traceProps,
      };
      this.trackTraceV3(telemetry);
    } else {
      const telemetry: TraceTelemetryV2 = {
        message: String(message),
        severity: severityLevels.v2[severity],
        properties: traceProps,
      };
      this.trackTraceV2(telemetry);
    }
  }

  private handleException(info: PlainObject, message: string | undefined, splat: unknown[]): void {
    const exceptions: Error[] = [];

    if (isErrorLike(info)) {
      exceptions.push(info);
    } else if (isErrorLike(message)) {
      exceptions.push(message);
    }

    for (const splatItem of splat) {
      if (isErrorLike(splatItem)) {
        exceptions.push(splatItem);
      }
    }

    if (exceptions.length === 0) {
      return;
    }

    for (const exception of exceptions) {
      const exceptionProps: PlainObject = {};

      if (typeof message === 'string' && exception.message !== message) {
        exceptionProps.message = message;
      }

      for (const splatItem of splat) {
        if (!isErrorLike(splatItem)) {
          if (typeof splatItem === 'string') {
            exceptionProps.additionalInfo = exceptionProps.additionalInfo != null ? `${exceptionProps.additionalInfo}; ${splatItem}` : splatItem;
          } else if (splatItem != null && typeof splatItem === 'object') {
            Object.assign(exceptionProps, splatItem);
          }
        }
      }

      if (this.options.version === 3) {
        this.trackExceptionV3({ exception, properties: exceptionProps });
      } else {
        this.trackExceptionV2({ exception, properties: exceptionProps });
      }
    }
  }

  private trackTraceV2(telemetry: TraceTelemetryV2): void {
    for (const f of (this.options.filters ?? []) as ITelemetryFilterV2[]) {
      if (!f.filterTrace(telemetry, this.options.client as TelemetryClientV2)) {
        return;
      }
    }
    (this.options.client as TelemetryClientV2).trackTrace(telemetry);
  }

  private trackTraceV3(telemetry: TraceTelemetryV3): void {
    for (const f of (this.options.filters ?? []) as ITelemetryFilterV3[]) {
      if (!f.filterTrace(telemetry, this.options.client as TelemetryClientV3)) {
        return;
      }
    }
    (this.options.client as TelemetryClientV3).trackTrace(telemetry);
  }

  private trackExceptionV2(telemetry: ExceptionTelemetryV2): void {
    for (const f of (this.options.filters ?? []) as ITelemetryFilterV2[]) {
      if (!f.filterException(telemetry, this.options.client as TelemetryClientV2)) {
        return;
      }
    }
    (this.options.client as TelemetryClientV2).trackException(telemetry);
  }

  private trackExceptionV3(telemetry: ExceptionTelemetryV3): void {
    for (const f of (this.options.filters ?? []) as ITelemetryFilterV3[]) {
      if (!f.filterException(telemetry, this.options.client as TelemetryClientV3)) {
        return;
      }
    }
    (this.options.client as TelemetryClientV3).trackException(telemetry);
  }

  private warnIfMessagePropertyFoundInLogData(splat: unknown[]): void {
    if (!this.warnOnMessageProperty) {
      return;
    }

    for (const splatItem of splat) {
      if (splatItem != null && typeof splatItem === 'object' && !isErrorLike(splatItem)) {
        const obj = splatItem as Record<string, unknown>;
        if ('message' in obj) {
          console.warn(
            `[winston-azure-application-insights] Warning: Found "message" property with value "${obj.message}" in log data. Winston will merge this with your main message. Consider using a different property name like "description" or "text". Set warnOnMessageProperty: false to disable this warning.`,
          );
          break;
        }
      }
    }
  }

  override log(info: PlainObject, callback: () => void): void {
    const { level, message } = info;
    const severity = this.getSeverity(level);
    const splat = Reflect.get(info, Symbol.for('splat')) ?? [];
    const logMeta = splat.length > 0 ? splat[0] : {};

    this.warnIfMessagePropertyFoundInLogData(splat);

    this.handleTrace(severity, info, message, logMeta);

    if (this.sendErrorsAsExceptions && severity >= LogLevel.Error) {
      this.handleException(info, message, splat);
    }

    callback();
  }

  private getSeverity(level: string) {
    return (this.options.levels ?? defaultLogLevels)[level] ?? this.options.defaultLevel ?? 'info';
  }
}
