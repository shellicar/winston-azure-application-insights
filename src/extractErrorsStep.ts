import { splatSymbol } from './consts';
import type { WinstonInfo } from './types';

export const extractErrorsStep = (info: WinstonInfo, isError: (obj: unknown) => boolean): Error[] => {
  const errors: Error[] = [];

  if (isError(info)) {
    errors.push(info as unknown as Error);
  }

  const splat = info[splatSymbol];
  if (splat != null) {
    for (const item of splat) {
      if (isError(item)) {
        errors.push(item as Error);
      }
    }
  }

  return errors;
};
