import { SPLAT } from 'triple-beam';
import type { IsError, TelemetryDataException } from '../public/types';
import { convertNullPrototypeToRegularObject } from './convertNullPrototypeToRegularObject';
import type { WinstonInfo } from './types';

const extractErrorProperties = (error: Error, ...additionalIgnore: string[]): Record<string, unknown> => {
  const ignore = ['message', 'name', 'stack', ...additionalIgnore];
  const properties: Record<string, unknown> = {};
  for (const key of Object.keys(error) as (keyof Error)[]) {
    if (!ignore.includes(key)) {
      const value = error[key];
      properties[key] = convertNullPrototypeToRegularObject(value);
    }
  }
  return properties;
};

export const extractErrorsStep = (info: WinstonInfo, isError: IsError): TelemetryDataException[] => {
  const exceptions: TelemetryDataException[] = [];

  if (isError(info)) {
    exceptions.push({
      exception: info,
      properties: extractErrorProperties(info, 'level'),
    });
  }

  const splat = info[SPLAT];
  if (splat != null) {
    for (const item of splat) {
      if (isError(item)) {
        exceptions.push({
          exception: item,
          properties: extractErrorProperties(item),
        });
      }
    }
  }

  return exceptions;
};
