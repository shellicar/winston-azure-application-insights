import type { Format } from 'logform';
import type { JsonObject } from './types';
import type { AzureApplicationInsightsLoggerOptions } from './winston-azure-application-insights';

export type CreateWinstonLoggerOptions = {
  insights: AzureApplicationInsightsLoggerOptions;
  winston: {
    level?: string;
    defaultMeta?: JsonObject;
    console: boolean;
    format?: Format[];
  };
};
