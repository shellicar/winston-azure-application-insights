import { describe, expect, it } from 'vitest';
import { makeSerializable } from '../../src/old/winston-azure-application-insights';

describe('makeSerializable behavior', () => {
  it('should handle a simple object', () => {
    const input = { hello: 10 };
    const result = makeSerializable(input);

    expect(result).toEqual({ hello: 10 });
  });

  it('should handle a primitive number', () => {
    const result = makeSerializable(50);

    expect(result).toBe(50);
  });

  it('should handle a string', () => {
    const result = makeSerializable('hello');

    expect(result).toBe('hello');
  });

  it('should handle a Date', () => {
    const date = new Date('2023-01-01');
    const result = makeSerializable(date);

    expect(result).toEqual(date);
  });

  it('should handle null', () => {
    const result = makeSerializable(null);

    expect(result).toBe(null);
  });

  it('should handle undefined', () => {
    const result = makeSerializable(undefined);

    expect(result).toBe(undefined);
  });

  it('should convert Error to plain object', () => {
    const error = new Error('test message');
    const result = makeSerializable(error) as Record<string, unknown>;

    expect(result).not.toBe(error);
    expect(result.message).toBe('test message');
    expect(result.name).toBe('Error');
    expect(typeof result.stack).toBe('string');
  });

  it('should convert class instance to plain object', () => {
    class TestClass {
      foo = 'bar';
      baz = 42;
    }
    const instance = new TestClass();
    const result = makeSerializable(instance);

    expect(result).not.toBe(instance);
    expect(result).toEqual({ foo: 'bar', baz: 42 });
  });
});
