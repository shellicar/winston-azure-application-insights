import { SPLAT } from 'triple-beam';
import type { IsError, TelemetryDataProperties } from '../public/types';
import { convertNullPrototypeToRegularObject } from './convertNullPrototypeToRegularObject';
import { isPlainObject } from './isPlainObject';
import type { WinstonInfo } from './types';

const extractNonSymbolProps = (obj: Record<string | symbol, unknown>): Record<string, unknown> | null => {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return null;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    result[key] = convertNullPrototypeToRegularObject(value);
  }
  return result;
};

const extractDefaultMeta = (info: WinstonInfo, isError: IsError): Record<string, unknown> | null => {
  if (isError(info)) {
    const { level, message, ...rest } = info;
    return extractNonSymbolProps(rest);
  }
  const { level, name, message, stack, cause, ...rest } = info;
  return extractNonSymbolProps(rest);
};

export const extractPropertiesStep = (info: WinstonInfo, isError: IsError = (x) => x instanceof Error): TelemetryDataProperties => {
  const defaultMeta = extractDefaultMeta(info, isError);

  const splat = info[SPLAT];
  if (splat == null) {
    return defaultMeta ?? {};
  }

  const nonErrorItems = splat.filter((item) => !isError(item));
  const firstObject = nonErrorItems[0];
  if (firstObject != null && isPlainObject(firstObject)) {
    return { ...defaultMeta, ...firstObject };
  }
  return defaultMeta ?? {};
};
