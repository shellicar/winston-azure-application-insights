import { splatSymbol } from './consts';
import type { WinstonInfo } from './types';

export const extractMessageStep = (info: WinstonInfo): WinstonInfo => {
  const splat = info[splatSymbol];
  const meta = splat?.[0] as { message?: unknown };

  if (meta?.message !== undefined) {
    const expectedSuffix = ` ${meta.message}`;

    if (info.message.endsWith(expectedSuffix)) {
      return {
        ...info,
        message: info.message.slice(0, -expectedSuffix.length),
      };
    }
  }

  return info;
};
