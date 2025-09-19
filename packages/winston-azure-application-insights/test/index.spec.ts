import { describe, expect, it } from 'vitest';
import { createApplicationInsightsTransport, createTelemetryHandler, createWinstonLogger } from '../src';

describe('exports', () => {
  it('createApplicationInsightsTransport should be exported', () => {
    expect(createApplicationInsightsTransport).toBeDefined();
    expect(typeof createApplicationInsightsTransport).toBe('function');
  });

  it('createTelemetryHandler should be exported', () => {
    expect(createTelemetryHandler).toBeDefined();
    expect(typeof createTelemetryHandler).toBe('function');
  });

  it('createWinstonLogger should be exported', () => {
    expect(createWinstonLogger).toBeDefined();
    expect(typeof createWinstonLogger).toBe('function');
  });
});
