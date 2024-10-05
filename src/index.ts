import type { CreateWinstonLoggerOptions } from './CreateWinstonLoggerOptions';
import { createWinstonLogger } from './createWinstonLogger';
import type { isRunningInAzure } from './isRunningInAzure';
import type { isRunningLocally } from './isRunningLocally';
import { AzureApplicationInsightsLogger } from './winston-azure-application-insights';
import { type AzureApplicationInsightsLoggerOptions, ITelemetryFilterV2, ITelemetryFilterV3 } from './winston-azure-application-insights';

export { AzureApplicationInsightsLogger, type AzureApplicationInsightsLoggerOptions, type CreateWinstonLoggerOptions, createWinstonLogger, type isRunningLocally, type isRunningInAzure, ITelemetryFilterV2, ITelemetryFilterV3 };
