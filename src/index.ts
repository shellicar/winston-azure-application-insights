import { isRunningInAzure } from './isRunningInAzure';
import { isRunningLocally } from './isRunningLocally';
import type { CreateWinstonLoggerOptions } from './old/CreateWinstonLoggerOptions';
import { createWinstonLogger } from './old/createWinstonLogger';
import { AzureApplicationInsightsLogger } from './old/winston-azure-application-insights';
import type { AzureApplicationInsightsLoggerOptions, ITelemetryFilterV2, ITelemetryFilterV3 } from './types';

export { AzureApplicationInsightsLogger, type AzureApplicationInsightsLoggerOptions, type CreateWinstonLoggerOptions, createWinstonLogger, isRunningLocally, isRunningInAzure };
export type { ITelemetryFilterV2, ITelemetryFilterV3 };
