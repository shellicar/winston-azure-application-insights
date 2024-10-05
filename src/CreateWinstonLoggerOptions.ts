import type { Format } from 'logform';
import type { AzureApplicationInsightsLoggerOptions, JsonObject, LogLevels } from './types';

export type CreateWinstonLoggerOptions = {
  insights: AzureApplicationInsightsLoggerOptions;
  winston: {
    level?: string;
    levels?: LogLevels;
    defaultMeta?: JsonObject;
    console: boolean;
    format?: Format[];
  };
};
