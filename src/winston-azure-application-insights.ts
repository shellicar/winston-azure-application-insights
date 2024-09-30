import type { TelemetryClient as TelemetryClientV2 } from 'applicationinsightsv2';
import type { SeverityLevel as KnownSeverityLevelV2, TraceTelemetry as TraceTelemetryV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import type { ExceptionTelemetry, KnownSeverityLevel as KnownSeverityLevelV3, TelemetryClient as TelemetryClientV3, TraceTelemetry as TraceTelemetryV3 } from 'applicationinsightsv3';
import TransportStream from 'winston-transport';

type PlainObject = Record<string, any>;

enum SeverityLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

const severityLevelsV3: Record<SeverityLevel, KnownSeverityLevelV3> = {
  [SeverityLevel.Verbose]: 'Verbose' as KnownSeverityLevelV3,
  [SeverityLevel.Information]: 'Information' as KnownSeverityLevelV3,
  [SeverityLevel.Warning]: 'Warning' as KnownSeverityLevelV3,
  [SeverityLevel.Error]: 'Error' as KnownSeverityLevelV3,
  [SeverityLevel.Critical]: 'Critical' as KnownSeverityLevelV3,
};
const severityLevelsV2: Record<SeverityLevel, KnownSeverityLevelV2> = {
  [SeverityLevel.Verbose]: 0,
  [SeverityLevel.Information]: 1,
  [SeverityLevel.Warning]: 2,
  [SeverityLevel.Error]: 3,
  [SeverityLevel.Critical]: 4,
};

const getMessageLevel = (winstonLevel: string): SeverityLevel => {
  const levels: Record<string, SeverityLevel> = {
    emerg: SeverityLevel.Critical,
    alert: SeverityLevel.Critical,
    crit: SeverityLevel.Critical,
    error: SeverityLevel.Error,
    warning: SeverityLevel.Warning,
    warn: SeverityLevel.Warning,
    notice: SeverityLevel.Information,
    info: SeverityLevel.Information,
    verbose: SeverityLevel.Verbose,
    debug: SeverityLevel.Verbose,
    silly: SeverityLevel.Verbose,
  } as const;

  return levels[winstonLevel] ?? SeverityLevel.Information;
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
  if (isPlainObject(obj)) {
    return obj;
  }
  return Object.assign({}, obj);
};

const extractPropsFromInfo = (info: PlainObject): PlainObject => {
  const exclude = ['level', 'message'];

  return Object.keys(info)
    .filter((key) => !exclude.includes(key))
    .reduce<PlainObject>((props, key) => {
      const value = info[key];
      props[key] = convertToPlainObject(value);
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

type AzureInsightsClientOptions =
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
  severity: SeverityLevel;
  properties: PlainObject;
};

export abstract class ITelemetryFilterV3 {
  public filterTrace(trace: TraceTelemetryV3, client: TelemetryClientV3): boolean {
    return true;
  }
  public filterException(trace: ExceptionTelemetry, client: TelemetryClientV3): boolean {
    return true;
  }
}
export abstract class ITelemetryFilterV2 {
  public filterTrace(trace: TraceTelemetryV2, client: TelemetryClientV2): boolean {
    return true;
  }
  public filterException(trace: ExceptionTelemetry, client: TelemetryClientV2): boolean {
    return true;
  }
}

export type AzureApplicationInsightsLoggerOptions = AzureInsightsClientOptions & {
  level?: string;
  silent?: boolean;
  sendErrorsAsExceptions?: boolean;
};

export class AzureApplicationInsightsLogger extends TransportStream {
  public sendErrorsAsExceptions: boolean;
  readonly name: string;

  public get client(): TelemetryClientV3 | TelemetryClientV2 {
    return this.options.client;
  }

  constructor(private readonly options: AzureApplicationInsightsLoggerOptions) {
    super({ level: options.level ?? 'info', silent: options.silent ?? false });
    this.name = 'applicationinsightslogger';
    this.sendErrorsAsExceptions = options.sendErrorsAsExceptions ?? true;
  }

  private handleTrace(severity: SeverityLevel, info: PlainObject, message: string | undefined, logMeta: PlainObject): void {
    const traceProps = extractPropsFromInfo(info);
    let errorArg: Error | undefined;

    if (isErrorLike(info)) {
      errorArg = info;
    } else if (isErrorLike(message)) {
      errorArg = message as unknown as Error;
    } else if (isErrorLike(logMeta)) {
      errorArg = logMeta;
    }

    if (errorArg) {
      Object.assign(traceProps, extractErrorPropsForTrace(errorArg));
    }

    if (logMeta !== errorArg) {
      Object.assign(traceProps, logMeta);
    }

    if (this.options.version === 3) {
      const telemetry: TraceTelemetryV3 = {
        message: String(message),
        severity: severityLevelsV3[severity],
        properties: traceProps,
      };
      for (const f of this.options.filters ?? []) {
        if (!f.filterTrace(telemetry, this.options.client)) {
          return;
        }
      }
      this.options.client.trackTrace(telemetry);
    } else {
      const telemetry: TraceTelemetryV2 = {
        message: String(message),
        severity: severityLevelsV2[severity],
        properties: traceProps,
      };
      for (const f of this.options.filters ?? []) {
        if (!f.filterTrace(telemetry, this.options.client)) {
          return;
        }
      }
      this.options.client.trackTrace(telemetry);
    }
  }

  private handleException(info: PlainObject, message: string | undefined, logMeta: PlainObject): void {
    const exceptionProps: PlainObject = {};
    let exception: Error | undefined;

    if (isErrorLike(info)) {
      exception = info;
    } else if (isErrorLike(message)) {
      exception = message as unknown as Error;
    } else if (isErrorLike(logMeta)) {
      exception = logMeta;
    } else {
      console.log('RETURNING', { message });
      return;
    }

    if (typeof message === 'string' && exception.message !== message) {
      exceptionProps.message = message;
    }

    if (exception !== logMeta) {
      Object.assign(exceptionProps, logMeta);
    }

    const telemetry: ExceptionTelemetry = { exception, properties: exceptionProps };
    if (this.options.version === 2) {
      for (const f of this.options.filters ?? []) {
        if (!f.filterException(telemetry, this.options.client)) {
          return;
        }
      }
    } else {
      for (const f of this.options.filters ?? []) {
        if (!f.filterException(telemetry, this.options.client)) {
          return;
        }
      }
    }
    this.options.client.trackException({ exception, properties: exceptionProps });
  }

  override log(info: PlainObject, callback: () => void): void {
    const { level, message } = info;
    const severity = getMessageLevel(level);
    const splat = Reflect.get(info, Symbol.for('splat')) ?? [];
    const logMeta = splat.length ? splat[0] : {};

    this.handleTrace(severity, info, message, logMeta);

    if (this.sendErrorsAsExceptions && severity >= SeverityLevel.Error) {
      this.handleException(info, message, logMeta);
    }

    callback();
  }
}
