import { describe, expect, it } from 'vitest';
import { config, createLogger } from 'winston';
import { ApplicationInsightsTransport } from '../src/private/ApplicationInsightsTransport';
import { defaultSeverityMapping } from '../src/private/consts';
import { extractSeverityStep } from '../src/private/extractSeverityStep';
import { TelemetrySeverity } from '../src/public/enums';
import type { SeverityMapping } from '../src/public/types';
import { SpyTelemetryHandler } from './spies/SpyTelemetryHandler';

describe('extractSeverityStep', () => {
  const telemetryHandler = new SpyTelemetryHandler();
  describe('Default severity mapping', () => {
    const transport = new ApplicationInsightsTransport({ telemetryHandler });

    it('should map verbose level to Verbose severity', () => {
      transport.log({ level: 'verbose', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should map silly level to Verbose severity', () => {
      transport.log({ level: 'silly', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });
  });

  describe('Custom severity mapping', () => {
    it('can pass override severity mapping', () => {
      const severityMapping: SeverityMapping = {};

      const action = () =>
        new ApplicationInsightsTransport({
          telemetryHandler,
          severityMapping,
        });

      expect(action).not.toThrow();
    });

    it('can map silly to critical', () => {
      const severityMapping: SeverityMapping = {
        silly: TelemetrySeverity.Critical,
      };

      const transport = new ApplicationInsightsTransport({
        telemetryHandler,
        severityMapping,
      });

      const logger = createLogger({
        level: 'silly',
        levels: config.npm.levels,
        transports: [transport],
      });
      logger.silly('critical message');

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Critical;
      expect(actual).toBe(expected);
    });
  });

  describe('Winston levels priority fallback', () => {
    it('should handle npm-style levels with priority fallback', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
      };

      transport.log({ level: 'http', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should handle mixed custom levels falling back to next mappable level', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        fatal: 0,
        error: 1,
        warn: 2,
        audit: 3,
        info: 4,
        custom: 5,
        debug: 6,
        silly: 7,
      };

      transport.log({ level: 'audit', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Information;

      expect(actual).toBe(expected);
    });

    it('should handle custom level between debug and info falling back to debug', () => {
      const transport = new ApplicationInsightsTransport({ telemetryHandler });
      transport.levels = {
        error: 0,
        warn: 1,
        info: 2,
        custom: 3,
        debug: 4,
        silly: 5,
      };

      transport.log({ level: 'custom', message: 'test' }, () => {});

      const actual = telemetryHandler.telemetry?.trace?.severity;
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });

    it('should fall back to Verbose when level not in levels map', () => {
      const info = { level: 'nonexistent', message: 'test' };
      const levels = {
        error: 0,
        warn: 1,
        info: 2,
      };

      const actual = extractSeverityStep(info, defaultSeverityMapping, levels);
      const expected = TelemetrySeverity.Verbose;

      expect(actual).toBe(expected);
    });
  });
});
