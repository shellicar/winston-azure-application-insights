import { createApplicationInsightsTransport } from './public/createApplicationInsightsTransport';
import { createTelemetryHandler } from './public/createTelemetryHandler';
import { createWinstonLogger } from './public/createWinstonLogger';
import { TelemetrySeverity } from './public/enums';
import { isRunningInAzure } from './public/isRunningInAzure';
import { isRunningLocally } from './public/isRunningLocally';
import type { AzureApplicationInsightsLoggerOptions, CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions, CreateWinstonLoggerOptions, ITelemetryFilterV2, ITelemetryFilterV3, TelemetryHandler, WinstonInfo } from './public/types';

export { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, TelemetrySeverity, isRunningInAzure, isRunningLocally };
export type { ITelemetryFilterV2, ITelemetryFilterV3, TelemetryHandler, WinstonInfo, AzureApplicationInsightsLoggerOptions, CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions, CreateWinstonLoggerOptions };
