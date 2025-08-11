import { ApplicationInsightsTransport } from './ApplicationInsightsTransport';
import { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger } from './createWinstonLogger';
import { TelemetrySeverity } from './enums';
import { isRunningInAzure } from './isRunningInAzure';
import { isRunningLocally } from './isRunningLocally';
import type { ITelemetryFilterV2, ITelemetryFilterV3 } from './types';
import type { AzureApplicationInsightsLoggerOptions, ExtractedProperties, RequiredOptions, SeverityMapping, TelemetryData, TelemetryHandler, WinstonInfo } from './types';

export { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, TelemetrySeverity, isRunningInAzure, isRunningLocally };
export type { ITelemetryFilterV2, ITelemetryFilterV3, TelemetryHandler, WinstonInfo, AzureApplicationInsightsLoggerOptions };
