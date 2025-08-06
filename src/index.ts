import { isRunningInAzure } from './isRunningInAzure';
import { isRunningLocally } from './isRunningLocally';
import type { CreateWinstonLoggerOptions } from './old/CreateWinstonLoggerOptions';
import { createWinstonLogger } from './old/createWinstonLogger';
import type { AzureApplicationInsightsLoggerOptions } from './old/types';
import { ITelemetryFilterV2, ITelemetryFilterV3 } from './old/types';
import { AzureApplicationInsightsLogger } from './old/winston-azure-application-insights';

export { AzureApplicationInsightsLogger, type AzureApplicationInsightsLoggerOptions, type CreateWinstonLoggerOptions, createWinstonLogger, isRunningLocally, isRunningInAzure, ITelemetryFilterV2, ITelemetryFilterV3 };
