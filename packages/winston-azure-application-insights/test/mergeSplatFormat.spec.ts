import type { TransformableInfo } from 'logform';
import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { mergeSplatFormat } from '../src/private/mergeSplatFormat';

const transform = (info: TransformableInfo): TransformableInfo => {
  const format = mergeSplatFormat();
  return format.transform(info) as TransformableInfo;
};

describe('mergeSplatFormat', () => {
  describe('when SPLAT is absent', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
    };

    it('returns info unchanged', () => {
      const expected = info;
      const actual = transform(info);

      expect(actual).toEqual(expected);
    });
  });

  describe('when SPLAT is empty', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [],
    };
    const result = transform(info);

    it('preserves level', () => {
      const expected = 'info';
      const actual = result.level;

      expect(actual).toBe(expected);
    });

    it('preserves message', () => {
      const expected = 'Hello';
      const actual = result.message;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT has only primitives', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: ['World', 42, true, null],
    };
    const result = transform(info);

    it('preserves level', () => {
      const expected = 'info';
      const actual = result.level;

      expect(actual).toBe(expected);
    });

    it('preserves message', () => {
      const expected = 'Hello';
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('does not add any new string keys', () => {
      const expected = ['level', 'message'];
      const actual = Object.keys(result);

      expect(actual).toEqual(expected);
    });
  });

  describe('when SPLAT has only arrays', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [
        [1, 2, 3],
        ['a', 'b'],
      ],
    };
    const result = transform(info);

    it('preserves level', () => {
      const expected = 'info';
      const actual = result.level;

      expect(actual).toBe(expected);
    });

    it('preserves message', () => {
      const expected = 'Hello';
      const actual = result.message;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT has only class instances', () => {
    class CustomClass {
      value = 123;
    }

    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [new CustomClass(), new Date()],
    };
    const result = transform(info);

    it('preserves level', () => {
      const expected = 'info';
      const actual = result.level;

      expect(actual).toBe(expected);
    });

    it('preserves message', () => {
      const expected = 'Hello';
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('does not merge class instance properties', () => {
      expect(result).not.toHaveProperty('value');
    });
  });

  describe('when SPLAT has single plain object', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [{ userId: 123 }],
    };
    const result = transform(info);

    it('preserves level', () => {
      const expected = 'info';
      const actual = result.level;

      expect(actual).toBe(expected);
    });

    it('preserves message', () => {
      const expected = 'Hello';
      const actual = result.message;

      expect(actual).toBe(expected);
    });

    it('merges userId from plain object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT has multiple plain objects', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [{ userId: 123 }, { sessionId: 'abc' }],
    };
    const result = transform(info);

    it('merges userId from first object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });

    it('merges sessionId from second object', () => {
      const expected = 'abc';
      const actual = result.sessionId;

      expect(actual).toBe(expected);
    });
  });

  describe('when same key appears in multiple SPLAT objects', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [{ field: 'first' }, { field: 'second' }, { field: 'last' }],
    };
    const result = transform(info);

    it('uses last value', () => {
      const expected = 'last';
      const actual = result.field;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT object has same key as existing info property', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      requestId: 'from-default-meta',
      [SPLAT]: [{ requestId: 'from-splat' }],
    };
    const result = transform(info);

    it('overwrites with SPLAT value', () => {
      const expected = 'from-splat';
      const actual = result.requestId;

      expect(actual).toBe(expected);
    });
  });

  describe('when info has existing properties not in SPLAT', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      environment: 'production',
      [SPLAT]: [{ userId: 123 }],
    };
    const result = transform(info);

    it('preserves environment', () => {
      const expected = 'production';
      const actual = result.environment;

      expect(actual).toBe(expected);
    });

    it('merges userId', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT has mixed primitives and plain objects', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: ['World', { userId: 123 }, 42],
    };
    const result = transform(info);

    it('merges userId from plain object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });
  });

  describe('when SPLAT has mixed arrays and plain objects', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [[1, 2, 3], { userId: 123 }],
    };
    const result = transform(info);

    it('merges userId from plain object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });

    it('does not merge array indices as properties', () => {
      expect(result).not.toHaveProperty('0');
    });
  });

  describe('when SPLAT has mixed class instances and plain objects', () => {
    class CustomClass {
      value = 'instance';
    }

    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [new CustomClass(), { userId: 123 }],
    };
    const result = transform(info);

    it('merges userId from plain object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });

    it('does not merge class instance properties', () => {
      expect(result).not.toHaveProperty('value');
    });
  });

  describe('when SPLAT has null and undefined with plain objects', () => {
    const info: TransformableInfo = {
      level: 'info',
      message: 'Hello',
      [SPLAT]: [null, undefined, { userId: 123 }],
    };
    const result = transform(info);

    it('merges userId from plain object', () => {
      const expected = 123;
      const actual = result.userId;

      expect(actual).toBe(expected);
    });
  });
});
