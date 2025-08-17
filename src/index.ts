import { createApplicationInsightsTransport } from './public/createApplicationInsightsTransport';
import { createTelemetryHandler } from './public/createTelemetryHandler';
import { createWinstonLogger } from './public/createWinstonLogger';
import { ApplicationInsightsVersion, TelemetrySeverity } from './public/enums';
import { isRunningInAzure } from './public/isRunningInAzure';
import { isRunningLocally } from './public/isRunningLocally';
import type {
  CreateApplicationInsightsTransportOptions,
  CreateTelemetryHandlerOptions,
  CreateWinstonLoggerOptions,
  IExceptionTelemetryFilter,
  ITraceTelemetryFilter,
  SeverityMapping,
  TelemetryData,
  TelemetryDataException,
  TelemetryDataProperties,
  TelemetryDataTrace,
  TelemetryHandler,
  WinstonColors,
  WinstonLevels,
} from './public/types';

export { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger, ApplicationInsightsVersion, TelemetrySeverity, isRunningInAzure, isRunningLocally };
export type {
  ITraceTelemetryFilter,
  IExceptionTelemetryFilter,
  TelemetryHandler,
  CreateApplicationInsightsTransportOptions,
  CreateTelemetryHandlerOptions,
  CreateWinstonLoggerOptions,
  TelemetryData,
  TelemetryDataException,
  TelemetryDataTrace,
  TelemetryDataProperties,
  SeverityMapping,
  WinstonLevels,
  WinstonColors,
};
