import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { RefactoredAzureApplicationInsightsTransport, type WinstonInfo } from '../src/refactored-logger';

// Spy transport to capture what winston actually passes
class SpyTransport extends RefactoredAzureApplicationInsightsTransport {
  public capturedWinstonInfo: WinstonInfo[] = [];

  public override log(info: WinstonInfo, next: () => void) {
    this.capturedWinstonInfo.push(info);
    super.log(info, next);
  }
}

describe('Integration: Winston → Refactored Transport', () => {
  it('should capture telemetry when winston logs a simple message', () => {
    // Arrange
    const capturedTelemetry: any[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: any) => capturedTelemetry.push(telemetry),
    };

    const transport = new RefactoredAzureApplicationInsightsTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const logger = createLogger({ transports: [transport] });

    // Act
    logger.info('Hello World');

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('Hello World');
  });

  it('should capture properties when winston logs with additional data', () => {
    // Arrange
    const capturedTelemetry: any[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: any) => capturedTelemetry.push(telemetry),
    };

    const spyTransport = new SpyTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const logger = createLogger({ transports: [spyTransport] });

    // Act
    logger.info('User action', { userId: 123, action: 'login' });

    // Debug: See what winston actually passed to our transport
    const info = spyTransport.capturedWinstonInfo[0];
    console.log('Winston info object:', JSON.stringify(info, null, 2));
    const splat = info[Symbol.for('splat')];
    console.log('Splat exists:', splat !== undefined);
    console.log('Splat content:', splat);
    if (splat) {
      console.log('Splat stringified:', JSON.stringify(splat, null, 2));
    }

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('User action');
    expect(capturedTelemetry[0].properties).toEqual({ userId: 123, action: 'login' });
  });

  it('should capture errors when winston logs with error', () => {
    // Arrange
    const capturedTelemetry: any[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: any) => capturedTelemetry.push(telemetry),
    };

    const spyTransport = new SpyTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const logger = createLogger({ transports: [spyTransport] });

    // Act
    const error = new Error('Database connection failed');
    logger.error('System error occurred', error);

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('System error occurred');
    expect(capturedTelemetry[0].errors).toHaveLength(1);
    expect(capturedTelemetry[0].errors[0]).toBe(error);
  });

  it('should handle mixed logging with properties and errors', () => {
    // Arrange
    const capturedTelemetry: any[] = [];
    const mockTelemetryHandler = {
      handleTelemetry: (telemetry: any) => capturedTelemetry.push(telemetry),
    };

    const spyTransport = new SpyTransport({
      telemetryHandler: mockTelemetryHandler,
    });

    const logger = createLogger({ transports: [spyTransport] });

    // Act
    const error = new Error('Validation failed');
    logger.warn('Processing failed', { userId: 456, operation: 'update' }, error);

    // Assert
    expect(capturedTelemetry).toHaveLength(1);
    expect(capturedTelemetry[0].message).toBe('Processing failed');
    expect(capturedTelemetry[0].properties).toEqual({ userId: 456, operation: 'update' });
    expect(capturedTelemetry[0].errors).toHaveLength(1);
    expect(capturedTelemetry[0].errors[0]).toBe(error);
  });
});
