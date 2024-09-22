import { TelemetryClient, KnownSeverityLevel } from 'applicationinsights';
import TransportStream from 'winston-transport';

type PlainObject = Record<string, any>;

enum SeverityLevel {
  Verbose = 0,
  Information = 1,
  Warning = 2,
  Error = 3,
  Critical = 4,
}

const knownSeverityLevels: Record<SeverityLevel, KnownSeverityLevel> = {
  [SeverityLevel.Verbose]: KnownSeverityLevel.Verbose,
  [SeverityLevel.Information]: KnownSeverityLevel.Information,
  [SeverityLevel.Warning]: KnownSeverityLevel.Warning,
  [SeverityLevel.Error]: KnownSeverityLevel.Error,
  [SeverityLevel.Critical]: KnownSeverityLevel.Critical,
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
  client: TelemetryClient;
  level?: string;
  silent?: boolean;
  sendErrorsAsExceptions?: boolean;
}

export class AzureApplicationInsightsLogger extends TransportStream {
  public readonly client: TelemetryClient;
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

    this.client.trackTrace({
      message: String(message),
      severity: knownSeverityLevels[severity],
      properties: traceProps,
    });
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
