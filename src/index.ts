import { createApplicationInsightsTransport } from './createApplicationInsightsTransport';
import { createTelemetryHandler } from './createTelemetryHandler';
import { createWinstonLogger } from './createWinstonLogger';
import { TelemetrySeverity } from './enums';
import { isRunningInAzure } from './isRunningInAzure';
import { isRunningLocally } from './isRunningLocally';
import type { AzureApplicationInsightsLoggerOptions, CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions, CreateWinstonLoggerOptions, ITelemetryFilterV2, ITelemetryFilterV3, TelemetryHandler, WinstonInfo } from './types';

export { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, TelemetrySeverity, isRunningInAzure, isRunningLocally };
export type { ITelemetryFilterV2, ITelemetryFilterV3, TelemetryHandler, WinstonInfo, AzureApplicationInsightsLoggerOptions, CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions as TelemetryHandlerFactoryOptions, CreateWinstonLoggerOptions };
