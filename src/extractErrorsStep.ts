import { splatSymbol } from './consts';
import type { WinstonInfo } from './types';

export const extractErrorsStep = (info: WinstonInfo): Error[] => {
  const errors: Error[] = [];

  if (info instanceof Error) {
    errors.push(info);
  }

  const splat = info[splatSymbol];
  if (splat != null) {
    for (const item of splat) {
      if (item instanceof Error) {
        errors.push(item);
      }
    }
  }

  return errors;
};
