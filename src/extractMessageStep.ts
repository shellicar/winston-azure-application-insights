import { SPLAT } from 'triple-beam';
import type { WinstonInfo } from './types';

export const extractMessageStep = (info: WinstonInfo): string => {
  const messageAsString = String(info.message);

  const splat = info[SPLAT];
  const meta = splat?.[0] as { message?: unknown };

  if (meta?.message !== undefined) {
    const expectedSuffix = ` ${meta.message}`;

    if (messageAsString.endsWith(expectedSuffix)) {
      return messageAsString.slice(0, -expectedSuffix.length);
    }
  }

  return messageAsString;
};
