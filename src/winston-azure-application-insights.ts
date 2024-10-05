import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { ExceptionTelemetry as ExceptionTelemetryV2, SeverityLevel as KnownSeverityLevelV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry as ExceptionTelemetryV3, KnownSeverityLevel as KnownSeverityLevelV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import TransportStream from 'winston-transport';
import { defaultLogLevels } from './logLevels';
import { type AzureApplicationInsightsLoggerOptions, type AzureLogLevels, type ITelemetryFilterV2, type ITelemetryFilterV3, LogLevel, type PlainObject } from './types';

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
  return obj instanceof Error;
};

const isPlainObject = (obj: unknown): obj is PlainObject => {
  return obj !== null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
};

const convertToPlainObject = (obj: any): PlainObject => {
  if (typeof obj !== 'object') {
    return obj;
  }
  return isPlainObject(obj) ? obj : { ...obj };
};

const extractPropsFromInfo = (info: PlainObject): PlainObject => {
  const exclude = ['level', 'message'];

  return Object.keys(info)
    .filter((key) => !exclude.includes(key))
    .reduce<PlainObject>((props, key) => {
      props[key] = convertToPlainObject(info[key]);
      return props;
    }, {});
};

const extractErrorPropsForTrace = (errorLike: Error): PlainObject => {
  const properties: PlainObject = {
    message: errorLike.message,
  };
  for (const [key, value] of Object.entries(errorLike)) {
    if (key !== 'stack' && Object.prototype.hasOwnProperty.call(errorLike, key)) {
      properties[key] = convertToPlainObject(value);
    }
  }
  return properties;
};

export class AzureApplicationInsightsLogger extends TransportStream {
  public sendErrorsAsExceptions: boolean;
  readonly name: string;

  public get client(): TelemetryClientV3 | TelemetryClientV2 {
    return this.options.client;
  }

  constructor(private readonly options: AzureApplicationInsightsLoggerOptions) {
    super({ level: options.defaultLevel ?? 'info', silent: options.silent ?? false });
    this.name = 'applicationinsightslogger';
    this.sendErrorsAsExceptions = options.sendErrorsAsExceptions ?? true;
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

  private handleException(info: PlainObject, message: string | undefined, logMeta: PlainObject): void {
    let exception: Error | undefined;

    if (isErrorLike(info)) {
      exception = info;
    } else if (isErrorLike(message)) {
      exception = message as unknown as Error;
    } else if (isErrorLike(logMeta)) {
      exception = logMeta;
    } else {
      return;
    }

    const exceptionProps: PlainObject = {};

    if (typeof message === 'string' && exception.message !== message) {
      exceptionProps.message = message;
    }

    if (exception !== logMeta) {
      Object.assign(exceptionProps, logMeta);
    }

    if (this.options.version === 3) {
      this.trackExceptionV3({ exception, properties: exceptionProps });
    } else {
      this.trackExceptionV2({ exception, properties: exceptionProps });
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

  override log(info: PlainObject, callback: () => void): void {
    const { level, message } = info;
    const severity = this.getSeverity(level);
    const splat = Reflect.get(info, Symbol.for('splat')) ?? [];
    const logMeta = splat.length ? splat[0] : {};

    this.handleTrace(severity, info, message, logMeta);

    if (this.sendErrorsAsExceptions && severity >= LogLevel.Error) {
      this.handleException(info, message, logMeta);
    }

    callback();
  }

  private getSeverity(level: string) {
    return (this.options.levels ?? defaultLogLevels)[level] ?? this.options.defaultLevel ?? 'info';
  }
}
