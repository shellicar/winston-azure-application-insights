import { SeverityLevel as KnownSeverityLevelV2 } from 'applicationinsightsv2/out/Declarations/Contracts';
import { KnownSeverityLevel as KnownSeverityLevelV3, TelemetryClient as TelemetryClientV3 } from 'applicationinsightsv3';
import TransportStream from 'winston-transport';
import type { NodeClient } from './types';

type PlainObject = Record<string, any>;

enum SeverityLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

const severityLevelsV3: Record<SeverityLevel, KnownSeverityLevelV3> = {
  [SeverityLevel.Verbose]: KnownSeverityLevelV3.Verbose,
  [SeverityLevel.Information]: KnownSeverityLevelV3.Information,
  [SeverityLevel.Warning]: KnownSeverityLevelV3.Warning,
  [SeverityLevel.Error]: KnownSeverityLevelV3.Error,
  [SeverityLevel.Critical]: KnownSeverityLevelV3.Critical,
};
const severityLevelsV2: Record<SeverityLevel, KnownSeverityLevelV2> = {
  [SeverityLevel.Verbose]: KnownSeverityLevelV2.Verbose,
  [SeverityLevel.Information]: KnownSeverityLevelV2.Information,
  [SeverityLevel.Warning]: KnownSeverityLevelV2.Warning,
  [SeverityLevel.Error]: KnownSeverityLevelV2.Error,
  [SeverityLevel.Critical]: KnownSeverityLevelV2.Critical,
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

export interface AzureApplicationInsightsLoggerOptions {
  client: NodeClient;
  level?: string;
  silent?: boolean;
  sendErrorsAsExceptions?: boolean;
}

export class AzureApplicationInsightsLogger extends TransportStream {
  public readonly client: NodeClient;
  public sendErrorsAsExceptions: boolean;
  readonly name: string;

  constructor(options: AzureApplicationInsightsLoggerOptions) {
    super({ level: options.level ?? 'info', silent: options.silent ?? false });
    this.client = options.client;
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

    if (this.client instanceof TelemetryClientV3) {
      this.client.trackTrace({
        message: String(message),
        severity: severityLevelsV3[severity],
        properties: traceProps,  
      });
    } else {
      this.client.trackTrace({
        message: String(message),
        severity: severityLevelsV2[severity],
        properties: traceProps,  
      });
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
      console.log('RETURNING', { message});
      return;
    }

    if (typeof message === 'string' && exception.message !== message) {
      exceptionProps.message = message;
    }

    if (exception !== logMeta) {
      Object.assign(exceptionProps, logMeta);
    }

    this.client.trackException({ exception, properties: exceptionProps });
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
