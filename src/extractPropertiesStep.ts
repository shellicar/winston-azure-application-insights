import { splatSymbol } from './consts';
import { isNotError } from './isNotError';
import { isPlainObject } from './isPlainObject';
import type { ExtractedProperties, SplatFilter, WinstonInfo } from './types';

export const extractPropertiesStep = (info: WinstonInfo, filter: SplatFilter = isNotError): ExtractedProperties => {
  const splat = info[splatSymbol]?.filter(filter) ?? [];

  if (splat.length === 0) {
    return {};
  }

  if (splat.length === 1 && isPlainObject(splat[0])) {
    return splat[0];
  }

  return splat;
};
