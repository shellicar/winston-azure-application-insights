import { splatSymbol } from './consts';
import { isPlainObject } from './isPlainObject';
import type { ExtractedProperties, WinstonInfo } from './types';

export const extractPropertiesStep = (info: WinstonInfo, isError: (obj: unknown) => boolean = (x) => x instanceof Error): ExtractedProperties => {
  // Only process splat items that are NOT errors
  const splat = info[splatSymbol];
  if (!splat) {
    return {};
  }

  const nonErrorItems = splat.filter((item) => !isError(item));

  if (nonErrorItems.length === 0) {
    return {};
  }

  if (nonErrorItems.length === 1 && isPlainObject(nonErrorItems[0])) {
    return nonErrorItems[0];
  }

  return nonErrorItems;
};
