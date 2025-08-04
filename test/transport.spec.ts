import { describe, expect, it } from 'vitest';
import { RefactoredAzureApplicationInsightsTransport, type WinstonInfo, splatSymbol } from '../src/refactored-logger';

describe('RefactoredAzureApplicationInsightsTransport - Unit', () => {
  it('should extract properties from winston info with splat data', () => {
    // Arrange - based on what we discovered winston actually sends
    const capturedTelemetry: any[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: any) => capturedTelemetry.push(telemetry),
    };

    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    // Real winston info structure from our spy
    const winstonInfo: WinstonInfo = {
      userId: 123,
      action: 'login',
      level: 'info',
      message: 'User action',
      [splatSymbol]: [{ userId: 123, action: 'login' }],
    };

    // Act
    transport.log(winstonInfo, () => {});

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('User action');
    expect(capturedTelemetry[0].properties).toEqual({ userId: 123, action: 'login' });
  });
});
