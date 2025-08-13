import { createApplicationInsightsTransport } from './public/createApplicationInsightsTransport';
import { createTelemetryHandler } from './public/createTelemetryHandler';
import { createWinstonLogger } from './public/createWinstonLogger';
import { TelemetrySeverity } from './public/enums';
import { isRunningInAzure } from './public/isRunningInAzure';
import { isRunningLocally } from './public/isRunningLocally';
import type { CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions, CreateWinstonLoggerOptions, IExceptionTelemetryFilter, ITraceTelemetryFilter, TelemetryHandler } from './public/types';

export { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, TelemetrySeverity, isRunningInAzure, isRunningLocally };
export type { ITraceTelemetryFilter, IExceptionTelemetryFilter, TelemetryHandler, CreateApplicationInsightsTransportOptions, CreateTelemetryHandlerOptions, CreateWinstonLoggerOptions };
