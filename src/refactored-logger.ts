import TransportStream from 'winston-transport';

export const splatSymbol = Symbol.for('splat');

export interface WinstonInfo {
  level: string;
  message: string;
  [splatSymbol]?: unknown[];
  [key: string]: unknown;
  [key: symbol]: unknown;
}

interface RefactoredOptions {
  telemetryHandler: {
    handleTelemetry: (telemetry: { message: string }) => void;
  };
}

export class RefactoredAzureApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: {
    handleTelemetry: (telemetry: { message: string }) => void;
  };

  constructor(options: RefactoredOptions) {
    super();
    this.telemetryHandler = options.telemetryHandler;
  }

  public override log(info: WinstonInfo, next: () => void) {
    this.telemetryHandler.handleTelemetry({
      message: info.message,
    });

    next();
  }
}

export function unconcatenateStep(info: WinstonInfo): WinstonInfo {
  const splat = info[splatSymbol];
  const firstObject = splat?.[0] as { message?: unknown };

  if (firstObject?.message !== undefined) {
    const expectedSuffix = ` ${firstObject.message}`;

    if (info.message.endsWith(expectedSuffix)) {
      return {
        ...info,
        message: info.message.slice(0, -expectedSuffix.length),
      };
    }
  }

  return info;
}

export function extractErrorsStep(info: WinstonInfo): Error[] {
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
}
