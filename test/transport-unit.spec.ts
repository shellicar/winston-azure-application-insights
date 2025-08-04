import { describe, expect, it } from 'vitest';
import { RefactoredAzureApplicationInsightsTransport, type TelemetryData, splatSymbol } from '../src/refactored-logger';

describe('RefactoredAzureApplicationInsightsTransport - Unit Tests', () => {
  it('should extract properties from winston info with splat', () => {
    // Arrange - Real winston structure we discovered
    const capturedTelemetry: TelemetryData[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: TelemetryData) => capturedTelemetry.push(telemetry),
    };

    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const winstonInfo = {
      level: 'info',
      message: 'User action',
      timestamp: '2025-01-04T10:02:45.640Z',
      [splatSymbol]: [{ userId: 123, action: 'login' }],
    };

    // Act
    transport.log(winstonInfo, () => {});

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('User action');
    expect(capturedTelemetry[0].properties).toEqual({ userId: 123, action: 'login' });
    expect(capturedTelemetry[0].errors).toEqual([]);
  });

  it('should extract errors from winston info', () => {
    // Arrange
    const capturedTelemetry: TelemetryData[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: TelemetryData) => capturedTelemetry.push(telemetry),
    };

    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const error = new Error('Test error');
    const winstonInfo = {
      level: 'error',
      message: 'Something failed',
      [splatSymbol]: [error],
    };

    // Act
    transport.log(winstonInfo, () => {});

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('Something failed');
    expect(capturedTelemetry[0].errors).toHaveLength(1);
    expect(capturedTelemetry[0].errors[0]).toBe(error);
    expect(capturedTelemetry[0].properties).toEqual({});
  });
});
