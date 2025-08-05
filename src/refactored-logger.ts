import TransportStream from 'winston-transport';

export const splatSymbol = Symbol.for('splat');

export type ExtractedProperties = Record<string, unknown> | unknown[];

export type SplatFilter = (item: unknown) => boolean;

export interface TelemetryData {
  message: string;
  properties: ExtractedProperties;
  errors: Error[];
  level: string;
}

export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}

export interface WinstonInfo {
  level: string;
  message: string;
  [splatSymbol]?: unknown[];
  [key: string]: unknown;
  [key: symbol]: unknown;
}

export interface ConstructorOptions {
  telemetryHandler: TelemetryHandler;
  sendErrorsAsExceptions?: boolean;
}

interface RequiredOptions {
  telemetryHandler: TelemetryHandler;
  sendErrorsAsExceptions: boolean;
}

export class RefactoredAzureApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: TelemetryHandler;
  private readonly options: RequiredOptions;

  constructor(options: ConstructorOptions) {
    super();
    this.options = {
      sendErrorsAsExceptions: options.sendErrorsAsExceptions ?? true,
      telemetryHandler: options.telemetryHandler,
    };
    this.telemetryHandler = options.telemetryHandler;
  }

  public override log(info: WinstonInfo, next: () => void) {
    const filter: SplatFilter = this.options.sendErrorsAsExceptions ? isNotError : () => true;

    const message = extractMessageStep(info);
    const properties = extractPropertiesStep(info, filter);
    const errors = this.options.sendErrorsAsExceptions ? extractErrorsStep(info) : [];

    this.telemetryHandler.handleTelemetry({
      message: message.message,
      properties: properties,
      errors: errors,
      level: info.level,
    });

    next();
  }
}

export const extractMessageStep = (info: WinstonInfo): WinstonInfo => {
  const splat = info[splatSymbol];
  const meta = splat?.[0] as { message?: unknown };

  if (meta?.message !== undefined) {
    const expectedSuffix = ` ${meta.message}`;

    if (info.message.endsWith(expectedSuffix)) {
      return {
        ...info,
        message: info.message.slice(0, -expectedSuffix.length),
      };
    }
  }

  return info;
};

export const extractErrorsStep = (info: WinstonInfo): Error[] => {
  const errors: Error[] = [];

  if (info instanceof Error) {
    errors.push(info);
  }

  const splat = info[splatSymbol];
  if (splat != null) {
    for (const item of splat) {
      if (item instanceof Error) {
        errors.push(item);
      }
    }
  }

  return errors;
};

const isError = (item: unknown): item is Error => item instanceof Error;

const isNotError = (item: unknown): boolean => !isError(item);

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => obj != null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;

export const extractPropertiesStep = (info: WinstonInfo, filter: SplatFilter = isNotError): ExtractedProperties => {
  const splat = info[splatSymbol]?.filter(filter) ?? [];

  if (splat.length === 0) {
    return {};
  }

  if (splat.length === 1 && isPlainObject(splat[0])) {
    return splat[0];
  }

  return splat;
};
