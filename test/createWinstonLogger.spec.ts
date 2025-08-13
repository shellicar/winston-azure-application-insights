import { describe, expect, it } from 'vitest';
import { Logger } from 'winston';
import { createWinstonLogger } from '../src/public/createWinstonLogger';
import { useEnvironmentVariable } from './helpers/useEnvironmentVariable';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

describe('createWinstonLogger', () => {
  it('creates a Winston logger instance', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: false, options: {} },
      insights: { version: 3, client },
    });

    expect(logger).toBeInstanceOf(Logger);
  });

  it('creates logger with Application Insights transport', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: false, options: {} },
      insights: { version: 3, client },
    });

    logger.info('Test message');

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test message');
  });

  it('creates logger with console transport when console: true', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: true, options: {} },
      insights: { version: 3, client },
    });

    expect(logger.transports).toHaveLength(2);
  });

  it('creates logger without console transport when console: false', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: false, options: {} },
      insights: { version: 3, client },
    });

    expect(logger.transports).toHaveLength(1);
  });

  it('passes winston configuration options correctly', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: {
        console: false,
        level: 'warn',
        defaultMeta: { service: 'test-service' },
        options: {},
      },
      insights: { version: 3, client },
    });

    expect(logger.level).toBe('warn');
    expect(logger.defaultMeta).toEqual({ service: 'test-service' });
  });

  describe('Auto console detection', () => {
    const websiteInstanceId = useEnvironmentVariable('WEBSITE_INSTANCE_ID');

    it('creates logger with console transport when console is undefined but running locally', () => {
      const client = new SpyTelemetryClientV3();

      websiteInstanceId.unset();

      const logger = createWinstonLogger({
        winston: {
          options: {},
        },
        insights: { version: 3, client },
      });

      expect(logger.transports).toHaveLength(2);
    });

    it('creates logger without console transport when console is undefined and running in Azure', () => {
      const client = new SpyTelemetryClientV3();

      websiteInstanceId.set('azure-instance-id');

      const logger = createWinstonLogger({
        winston: {
          options: {},
        },
        insights: { version: 3, client },
      });

      expect(logger.transports).toHaveLength(1);
    });
  });
});
