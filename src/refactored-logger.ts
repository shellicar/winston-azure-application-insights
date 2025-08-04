import { TelemetryClient } from 'applicationinsightsv2';
import TransportStream from 'winston-transport';

export const splatSymbol = Symbol.for('splat');

export type ExtractedProperties = Record<string, unknown> | unknown[];

export interface TelemetryData {
  message: string;
  properties: ExtractedProperties;
  errors: Error[];
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

interface RefactoredOptions {
  telemetryHandler: TelemetryHandler;
}

export class RefactoredAzureApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: TelemetryHandler;

  constructor(options: RefactoredOptions) {
    super();
    this.telemetryHandler = options.telemetryHandler;
  }

  public override log(info: WinstonInfo, next: () => void) {
    const message = extractMessageStep(info);
    const properties = extractPropertiesStep(info);
    const errors = extractErrorsStep(info);

    this.telemetryHandler.handleTelemetry({
      message: message.message,
      properties: properties,
      errors: errors,
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

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => obj != null && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;

export const extractPropertiesStep = (info: WinstonInfo): ExtractedProperties => {
  const splat = info[splatSymbol];

  if (splat != null && splat.length > 0) {
    const nonErrorItems = splat.filter((x) => !isError(x));

    if (nonErrorItems.length === 0) {
      return {};
    }

    if (nonErrorItems.length === 1) {
      if (isPlainObject(nonErrorItems[0])) {
        return nonErrorItems[0];
      }
    }

    return nonErrorItems;
  }

  return {};
};
