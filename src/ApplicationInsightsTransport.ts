import TransportStream from 'winston-transport';
import { defaultSeverityMapping } from './consts';
import { TelemetrySeverity } from './enums';
import { extractErrorsStep } from './extractErrorsStep';
import { extractMessageStep } from './extractMessageStep';
import { extractPropertiesStep } from './extractPropertiesStep';
import { isNotError } from './isNotError';
import type { ConstructorOptions, RequiredOptions, SplatFilter, TelemetryHandler, WinstonInfo, WinstonLevels } from './types';

export class ApplicationInsightsTransport extends TransportStream {
  private readonly telemetryHandler: TelemetryHandler;
  private readonly options: RequiredOptions;

  public levels?: WinstonLevels;

  constructor(options: ConstructorOptions) {
    super();
    this.options = {
      sendErrorsAsExceptions: options.sendErrorsAsExceptions ?? true,
      telemetryHandler: options.telemetryHandler,
      severityMapping: options.severityMapping ?? defaultSeverityMapping,
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
      severity: this.mapUnknownLevelToSeverity(info.level),
    });

    next();
  }

  private mapLevelToSeverity(level: string): TelemetrySeverity | null {
    return this.options.severityMapping[level] ?? null;
  }

  private mapUnknownLevelToSeverity(level: string): TelemetrySeverity {
    const directMapping = this.mapLevelToSeverity(level);
    if (directMapping != null) {
      return directMapping;
    }

    if (this.levels != null) {
      const currentPriority = this.levels[level];
      const sortedLevels = Object.entries(this.levels)
        .map((x) => ({ levelName: x[0], priority: x[1] }))
        .filter((x) => currentPriority < x.priority)
        .sort((a, b) => a.priority - b.priority);

      for (const { levelName } of sortedLevels) {
        const severity = this.mapLevelToSeverity(levelName);
        if (severity) {
          return severity;
        }
      }
    }

    return TelemetrySeverity.Verbose;
  }
}
