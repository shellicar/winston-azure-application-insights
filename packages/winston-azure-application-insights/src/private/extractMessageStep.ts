import { SPLAT } from 'triple-beam';
import type { WinstonInfo } from './types';

const getMessageAsString = (info: WinstonInfo) => {
  let messageAsString = String(info.message);
  const splat = info[SPLAT] ?? [];
  const meta = splat[0] as { message?: unknown };

  if (meta?.message !== undefined) {
    const expectedSuffix = ` ${meta.message}`;
    if (messageAsString.endsWith(expectedSuffix)) {
      messageAsString = messageAsString.slice(0, -expectedSuffix.length);
    }
  }

  return { messageAsString, splat };
};

const extractMessageStepInternal = (info: WinstonInfo): string => {
  const { messageAsString, splat } = getMessageAsString(info);
  const strings = splat.filter((x) => typeof x === 'string');
  return [messageAsString, ...strings].join(' ');
};

export const extractMessageStep = (info: WinstonInfo): string => {
  const result = extractMessageStepInternal(info);
  return result;
};
