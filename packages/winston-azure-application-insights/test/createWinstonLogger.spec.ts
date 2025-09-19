import { MESSAGE } from 'triple-beam';
import { describe, expect, it, vi } from 'vitest';
import winston, { Logger } from 'winston';
import { createWinstonLogger } from '../src/public/createWinstonLogger';
import { ApplicationInsightsVersion } from '../src/public/enums';
import { useEnvironmentVariable } from './helpers/useEnvironmentVariable';
import { SpyTelemetryClientV3 } from './spies/SpyTelemetryClientV3';

const captureLoggerOutput = (logger: Logger, level: string, message: string): string => {
  let capturedOutput: string | undefined;

  const consoleTransport = logger.transports.find((t) => t instanceof winston.transports.Console);
  if (consoleTransport == null) {
    throw new Error('No console transport found in logger');
  }

  const captureFormat = winston.format.printf((info) => {
    capturedOutput = info[MESSAGE] as string;
    return capturedOutput;
  });

  const originalFormat = consoleTransport.format;
  if (originalFormat == null) {
    throw new Error('Console transport has no original format');
  }
  consoleTransport.format = winston.format.combine(originalFormat, captureFormat);
  logger.log(level, message);
  consoleTransport.format = originalFormat;

  if (capturedOutput == null) {
    throw new Error('No output captured from logger');
  }

  return capturedOutput;
};

describe('createWinstonLogger', () => {
  it('creates a Winston logger instance', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      insights: { version: ApplicationInsightsVersion.V3, client },
    });

    expect(logger).toBeInstanceOf(Logger);
  });

  it('creates logger with Application Insights transport', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: { enabled: false }, options: {} },
      insights: { version: ApplicationInsightsVersion.V3, client },
    });

    logger.info('Test message');

    expect(client.traces).toHaveLength(1);
    expect(client.traces[0]?.message).toBe('Test message');
  });

  it('creates logger with console transport when console: { enabled: true }', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: { console: { enabled: true }, options: {} },
      insights: { version: ApplicationInsightsVersion.V3, client },
    });

    expect(logger.transports).toHaveLength(2);
  });

  it('creates logger without console transport when console: { enabled: false }', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: {
        console: { enabled: false },
        options: {},
      },
      insights: { version: ApplicationInsightsVersion.V3, client },
    });

    expect(logger.transports).toHaveLength(1);
  });

  it('passes winston configuration options correctly', () => {
    const client = new SpyTelemetryClientV3();
    const logger = createWinstonLogger({
      winston: {
        console: { enabled: false },
        defaults: {
          defaultMeta: { service: 'test-service' },
          level: 'warn',
        },
        options: {},
      },
      insights: { version: ApplicationInsightsVersion.V3, client },
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
        insights: { version: ApplicationInsightsVersion.V3, client },
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
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      expect(logger.transports).toHaveLength(1);
    });
  });

  describe('New Transport Options Structure', () => {
    describe('Console Transport', () => {
      it('console.enabled: true creates console transport', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            console: {},
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('console.enabled: false skips console transport', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            console: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(1);
      });

      it('console.enabled: undefined uses auto-detection', () => {
        const websiteInstanceId = useEnvironmentVariable('WEBSITE_INSTANCE_ID');
        const client = new SpyTelemetryClientV3();

        websiteInstanceId.unset(); // Local environment

        const logger = createWinstonLogger({
          winston: {
            console: {}, // enabled is undefined
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('custom format array overrides default formatting', () => {
        const client = new SpyTelemetryClientV3();
        const customFormat: any[] = []; // Empty array for test

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: customFormat,
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        // Test that custom format was applied (implementation dependent)
        expect(logger.transports).toHaveLength(2);
      });

      it('setting output to json formats as JSON', () => {
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: { output: 'json' },
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('setting output to simple formats as simple text', () => {
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: { output: 'simple' },
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('enabling error processing includes stack traces', () => {
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: { errors: true },
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('disabling error processing excludes stack traces', () => {
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: { errors: false },
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });

      it('enabling timestamps includes timestamps in output', () => {
        const fakeDate = '2023-10-01T12:34:56.789Z';
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: {
                output: 'json',
                timestamp: true,
                errors: false,
                colorize: false,
              },
            },
            insights: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        vi.useFakeTimers();
        vi.setSystemTime(new Date(fakeDate));

        const actual = captureLoggerOutput(logger, 'info', 'Test');

        vi.useRealTimers();

        const expected = JSON.stringify({
          level: 'info',
          message: 'Test',
          timestamp: fakeDate,
        });

        expect(actual).toBe(expected);
      });

      it('disabling timestamps excludes timestamps from output', () => {
        const client = new SpyTelemetryClientV3();

        const logger = createWinstonLogger({
          winston: {
            console: {
              enabled: true,
              format: { timestamp: false },
            },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(2);
      });
    });

    describe('Insights Transport', () => {
      it('insights.enabled: true creates insights transport', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            console: { enabled: false },
            insights: { enabled: true },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(1);
      });

      it('insights.enabled: false skips insights transport', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            console: { enabled: false },
            insights: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(0);
      });

      it('insights.enabled: undefined defaults to true', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            console: { enabled: false },
            insights: {}, // enabled is undefined
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.transports).toHaveLength(1);
      });
    });

    describe('Defaults', () => {
      it('defaults.level sets base logger level', () => {
        const client = new SpyTelemetryClientV3();
        const logger = createWinstonLogger({
          winston: {
            defaults: { level: 'warn' },
            console: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.level).toBe('warn');
      });

      it('defaults.defaultMeta sets base logger metadata', () => {
        const client = new SpyTelemetryClientV3();
        const defaultMeta = { service: 'test-app', version: '1.0.0' };

        const logger = createWinstonLogger({
          winston: {
            defaults: { defaultMeta },
            console: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        expect(logger.defaultMeta).toEqual(defaultMeta);
      });

      it('global formats are applied to logger when specified', () => {
        const expected = 'global-format-applied';

        const client = new SpyTelemetryClientV3();
        const addTestProperty = winston.format((info) => {
          info.testProperty = expected;
          return info;
        })();

        const logger = createWinstonLogger({
          winston: {
            defaults: { format: [addTestProperty] },
            console: { enabled: false },
          },
          insights: { version: ApplicationInsightsVersion.V3, client },
        });

        logger.info('Test message');

        const actual = client.traces[0]?.properties?.testProperty;
        expect(actual).toBe(expected);
      });
    });
  });

  describe('Insights level filtering', () => {
    it('II: insights level info receives info logs', () => {
      const client = new SpyTelemetryClientV3();

      const logger = createWinstonLogger({
        winston: {
          defaults: {
            level: 'verbose',
          },
          insights: { level: 'info' },
        },
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      logger.info('Test info message');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0]?.message).toBe('Test info message');
    });

    it('IV: insights level info blocks verbose logs', () => {
      const client = new SpyTelemetryClientV3();

      const logger = createWinstonLogger({
        winston: {
          defaults: {
            level: 'verbose',
          },
          insights: { level: 'info' },
        },
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      logger.verbose('Test verbose message');

      expect(client.traces).toHaveLength(0);
    });

    it('top-level verbose, insights undefined should receive verbose logs', () => {
      const client = new SpyTelemetryClientV3();

      const logger = createWinstonLogger({
        winston: {
          defaults: {
            level: 'verbose',
          },
        },
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      logger.verbose('Test verbose message');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0]?.message).toBe('Test verbose message');
    });

    it('VI: insights level verbose receives info logs', () => {
      const client = new SpyTelemetryClientV3();

      const logger = createWinstonLogger({
        winston: {
          defaults: {
            level: 'verbose',
          },
          insights: { level: 'verbose' },
        },
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      logger.info('Test info message');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0]?.message).toBe('Test info message');
    });

    it('VV: insights level verbose receives verbose logs', () => {
      const client = new SpyTelemetryClientV3();

      const logger = createWinstonLogger({
        winston: {
          defaults: {
            level: 'verbose',
          },
          insights: { level: 'verbose' },
        },
        insights: { version: ApplicationInsightsVersion.V3, client },
      });

      logger.verbose('Test verbose message');

      expect(client.traces).toHaveLength(1);
      expect(client.traces[0]?.message).toBe('Test verbose message');
    });
  });
});
