import type { CreateWinstonLoggerOptions } from './CreateWinstonLoggerOptions';
import { createWinstonLogger } from './createWinstonLogger';
import { isRunningInAzure } from './isRunningInAzure';
import { isRunningLocally } from './isRunningLocally';
import type { AzureApplicationInsightsLoggerOptions } from './types';
import { ITelemetryFilterV2, ITelemetryFilterV3 } from './types';
import { AzureApplicationInsightsLogger } from './winston-azure-application-insights';

export { AzureApplicationInsightsLogger, type AzureApplicationInsightsLoggerOptions, type CreateWinstonLoggerOptions, createWinstonLogger, isRunningLocally, isRunningInAzure, ITelemetryFilterV2, ITelemetryFilterV3 };
