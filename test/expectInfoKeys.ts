import { expect } from 'vitest';
import type { WinstonInfo } from '../src/private/types';

export const expectInfoKeys = (info: WinstonInfo, expectedKeys: string[]) => {
  const actualKeys = Object.keys(info).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  expect(actualKeys).toEqual(sortedExpectedKeys);
};
