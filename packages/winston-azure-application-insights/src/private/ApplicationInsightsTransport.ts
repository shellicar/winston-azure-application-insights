import TransportStream from 'winston-transport';
import type { TelemetryDataException, TelemetryHandler, WinstonLevels } from '../public/types';
import { defaultSeverityMapping } from './consts';
import { extractErrorsStep } from './extractErrorsStep';
import { extractMessageStep } from './extractMessageStep';
import { extractPropertiesStep } from './extractPropertiesStep';
import { extractSeverityStep } from './extractSeverityStep';
import { isError } from './isError';
import type { ApplicationInsightsTransportOptions, RequiredOptions, WinstonInfo } from './types';

export class ApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: TelemetryHandler;
  private readonly options: RequiredOptions;

  public levels?: WinstonLevels;

  constructor(options: ApplicationInsightsTransportOptions) {
    super({
      level: options.level,
    });
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
    const exceptions = this.getExceptions(info);
    const trace = this.getTrace(info, exceptions);

    this.telemetryHandler.handleTelemetry({
      trace,
      exceptions,
    });

    next();
  }

  private getTrace(info: WinstonInfo, filteredExceptions: TelemetryDataException[]) {
    const trace = this.extractTrace(info, filteredExceptions);
    if (trace != null && this.options.traceFilter(trace)) {
      return trace;
    }
    return null;
  }

  private getExceptions(info: WinstonInfo) {
    const exceptions = extractErrorsStep(info, this.options.isError);
    const filtered = exceptions.filter(this.options.exceptionFilter);
    return filtered;
  }

  private extractTrace(info: WinstonInfo, errors: TelemetryDataException[]) {
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
