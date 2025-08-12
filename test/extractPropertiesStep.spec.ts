import { beforeEach, describe, expect, it } from 'vitest';
import { splatSymbol } from '../src/consts';
import { extractPropertiesStep } from '../src/extractPropertiesStep';
import type { WinstonInfo } from '../src/types';
import type { TelemetryData } from '../src/types';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('Refactored AzureApplicationInsightsLogger', () => {
  const telemetryHandler = new SpyTelemetryHandler();

  describe('extractPropertiesStep', () => {
    it('should extract defaultMeta properties from info object', () => {
      // Simulate what Winston does when defaultMeta is set
      const info: WinstonInfo = {
        level: 'info',
        message: 'test message',
        userId: 123, // defaultMeta property
        appVersion: '1.0.0', // defaultMeta property
      };

      const actual = extractPropertiesStep(info);
      const expected = { userId: 123, appVersion: '1.0.0' };

      expect(actual).toEqual(expected);
    });

    it('should extract single property object directly', () => {
      const expected = { userId: 123, action: 'login' };

      const info: WinstonInfo = {
        level: 'info',
        message: 'User logged in',
        [splatSymbol]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should return empty object when no properties', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'simple message',
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });

    describe('with multiple property objects', () => {
      const properties1 = { userId: 123 };
      const properties2 = { sessionId: 'abc' };
      const error = new Error('test');

      const info: WinstonInfo = {
        level: 'info',
        message: 'mixed data',
        [splatSymbol]: ['string', 42, properties1, error, null, properties2, true],
      };

      it('should return defaultMeta when first splat item is primitive', () => {
        const result = extractPropertiesStep(info);
        const expected = {};
        expect(result).toEqual(expected);
      });

      it('should return defaultMeta when first splat item is primitive ignoring later objects', () => {
        const result = extractPropertiesStep(info);
        const expected = {};
        expect(result).toEqual(expected);
      });
    });

    it('should handle object with message property directly when single', () => {
      const expected = { message: 'world', userId: 123 };

      const info: WinstonInfo = {
        level: 'info',
        message: 'hello',
        [splatSymbol]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should extract single property object even with multiple errors', () => {
      const expected = { key1: 'hello', key2: 'world' };
      const error1 = new Error('error1');
      const error2 = new Error('error2');

      const info: WinstonInfo = {
        level: 'error',
        message: 'oh noes',
        [splatSymbol]: [error1, error2, expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should return empty object when splat contains only errors', () => {
      const info: WinstonInfo = {
        level: 'error',
        message: 'error occurred',
        [splatSymbol]: [new Error('test error')],
      };

      const actual = extractPropertiesStep(info);
      const expected = {};

      expect(actual).toEqual(expected);
    });
  });

  describe('Object Type Discrimination Tests', () => {
    it('should extract plain object directly', () => {
      const expected = { userId: 123, action: 'login' };
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [expected],
      };

      const actual = extractPropertiesStep(info);

      expect(actual).toEqual(expected);
    });

    it('should handle array as single item', () => {
      const arrayObject = [1, 2, 3];
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [arrayObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = { '0': 1, '1': 2, '2': 3 }; // Winston spreads arrays as indexed properties

      expect(actual).toEqual(expected);
    });

    it('should handle Date as single item', () => {
      const dateObject = new Date('2025-01-01');
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [dateObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {}; // Winston ignores primitives like Date for property extraction

      expect(actual).toEqual(expected);
    });

    it('should handle custom class as single item', () => {
      class CustomClass {
        prop = 'value';
        method() {
          return 'test';
        }
      }
      const customObject = new CustomClass();

      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [customObject],
      };

      const actual = extractPropertiesStep(info);
      const expected = {}; // Winston ignores non-plain objects for property extraction

      expect(actual).toEqual(expected);
    });

    it('should handle string as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: ['hello'],
      };

      const actual = extractPropertiesStep(info);
      const expected = {}; // Winston ignores primitives for property extraction

      expect(actual).toEqual(expected);
    });

    it('should handle number as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [42],
      };

      const actual = extractPropertiesStep(info);
      const expected = {}; // Winston ignores primitives for property extraction

      expect(actual).toEqual(expected);
    });

    it('should handle boolean as single item', () => {
      const info: WinstonInfo = {
        level: 'info',
        message: 'test',
        [splatSymbol]: [true],
      };

      const actual = extractPropertiesStep(info);
      const expected = {}; // Winston ignores primitives for property extraction

      expect(actual).toEqual(expected);
    });
  });
});
