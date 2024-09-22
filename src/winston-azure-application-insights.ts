import { TelemetryClient, KnownSeverityLevel } from 'applicationinsights';
import TransportStream from 'winston-transport';


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

const extractPropsFromInfo = (info: Record<string, any>): Record<string, any> => {
  const exclude = ['level', 'message'];
  return Object.keys(info)
    .filter((key) => !exclude.includes(key))
    .reduce((props, key) => ({ ...props, [key]: info[key] }), {});
};

const extractErrorPropsForTrace = (errorLike: Error): Record<string, any> => {
  const properties: Record<string, any> = {
    message: errorLike.message,
  };
  for (const [key, value] of Object.entries(errorLike)) {
    if (key !== 'stack') {
      properties[key] = value;
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

  private handleTrace(severity: SeverityLevel, info: Record<string, any>, message: string | undefined, logMeta: Record<string, any>): void {
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

  private handleException(info: Record<string, any>, message: string | undefined, logMeta: Record<string, any>): void {
    const exceptionProps: Record<string, any> = {};
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

  override log(info: Record<string, any>, callback: () => void): void {
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
