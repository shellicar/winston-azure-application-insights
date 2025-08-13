import { SPLAT } from 'triple-beam';
import { expect } from 'vitest';
import type { WinstonInfo } from '../src';

export const expectInfo = (actual: WinstonInfo, expected: WinstonInfo) => {
  const expectedSplat = expected[SPLAT];
  const actualSplat = actual[SPLAT];

  expect(actualSplat).toEqual(expectedSplat);

  for (const [key, value] of Object.entries(expected)) {
    console.log('Expecting key:', key, 'to have value:', value);
    expect(actual[key]).toBe(value);
  }
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  expect(actualKeys).toEqual(expectedKeys);
};
