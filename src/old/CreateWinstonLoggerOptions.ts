import type { Format } from 'logform';
import type { config } from 'winston';
import type { AzureApplicationInsightsLoggerOptions, JsonObject } from './types';

export type CreateWinstonLoggerOptions = {
  insights: AzureApplicationInsightsLoggerOptions;
  winston: {
    level?: string;
    levels?: config.AbstractConfigSetLevels;
    defaultMeta?: JsonObject;
    console: boolean;
    format?: Format[];
  };
};
