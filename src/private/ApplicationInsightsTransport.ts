import TransportStream from 'winston-transport';
import type { AzureApplicationInsightsLoggerOptions, TelemetryDataException, TelemetryHandler, WinstonLevels } from '../public/types';
import { defaultSeverityMapping } from './consts';
import { extractErrorsStep } from './extractErrorsStep';
import { extractMessageStep } from './extractMessageStep';
import { extractPropertiesStep } from './extractPropertiesStep';
import { extractSeverityStep } from './extractSeverityStep';
import { isError } from './isError';
import type { RequiredOptions, WinstonInfo } from './types';

export class ApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: TelemetryHandler;
  private readonly options: RequiredOptions;

  public levels?: WinstonLevels;

  constructor(options: AzureApplicationInsightsLoggerOptions) {
    super();
    this.options = {
      telemetryHandler: options.telemetryHandler,
      severityMapping: options.severityMapping ?? defaultSeverityMapping,
      isError: options.isError ?? isError,
      traceFilter: options.traceFilter ?? (() => true),
      exceptionFilter: options.exceptionFilter ?? (() => true),
    };
    this.telemetryHandler = options.telemetryHandler;
  }

  public override log(info: WinstonInfo, next: () => void) {
    const exceptions = extractErrorsStep(info, this.options.isError).filter((x) => this.options.exceptionFilter(x));
    console.log('Extracted exceptions:', exceptions);
    const trace = [this.getTrace(info, exceptions)].filter((x) => x != null).filter((x) => this.options.traceFilter(x))[0] ?? null;

    this.telemetryHandler.handleTelemetry({
      trace,
      exceptions,
    });

    next();
  }

  private getTrace(info: WinstonInfo, errors: TelemetryDataException[]) {
    const shouldSendOnlyException = errors.length > 0 && this.options.isError(info);

    if (shouldSendOnlyException) {
      return null;
    }

    const message = extractMessageStep(info);
    const properties = extractPropertiesStep(info, this.options.isError);
    const severity = extractSeverityStep(info, this.options.severityMapping, this.levels);

    return {
      message: message,
      properties,
      severity,
    };
  }
}
