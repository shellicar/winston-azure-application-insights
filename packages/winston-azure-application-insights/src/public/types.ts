import type { ColorizeOptions, Format, TimestampOptions } from 'logform';
import type { ApplicationInsightsVersion, TelemetrySeverity } from './enums';
import type { ITelemetryClientV2 } from './ITelemetryClientV2';
import type { ITelemetryClientV3 } from './ITelemetryClientV3';

export type TelemetryDataProperties = Record<string, unknown>;

export interface TelemetryDataTrace {
  message: string;
  properties: TelemetryDataProperties;
  severity: TelemetrySeverity;
}

export interface TelemetryDataException {
  exception: Error;
  properties: TelemetryDataProperties;
}

export interface TelemetryData {
  trace: TelemetryDataTrace | null;
  exceptions: TelemetryDataException[];
}

export interface TelemetryHandler {
  handleTelemetry: (telemetry: TelemetryData) => void;
}

export interface SeverityMapping {
  [level: string]: TelemetrySeverity;
}

export type IsError = (obj: unknown) => obj is Error;

export type ITraceTelemetryFilter = (trace: TelemetryDataTrace) => boolean;
export type IExceptionTelemetryFilter = (exception: TelemetryDataException) => boolean;

/**
 * Pass in either a TelemetryClient and the version of the Application Insights SDK,
 * Or a TelemetryHandler.
 */
export type CreateTelemetryHandlerOptions =
  | {
      /**
       * Telemetry client for `applicationinsights@2`
       */
      client: ITelemetryClientV2;
      version: ApplicationInsightsVersion.V2;
    }
  | {
      /**
       * Telemetry client for `applicationinsights@3`
       */
      client: ITelemetryClientV3;
      version: ApplicationInsightsVersion.V3;
    }
  | {
      telemetryHandler: TelemetryHandler;
      version?: never;
    };

/**
 * Configuration options for creating an Application Insights transport.
 */
export type CreateApplicationInsightsTransportOptions = {
  /**
   * Custom mapping from Winston log levels to Application Insights severity levels.
   * If not provided, uses default mappings (error → Error, warn → Warning, info → Information, etc.).
   * Custom levels fall back to the next available severity based on level priority.
   */
  severityMapping?: SeverityMapping;

  /**
   * Optional filter function called before sending traces to Application Insights.
   * Return false to prevent the trace from being sent. Useful for filtering out verbose logs or specific patterns.
   */
  traceFilter?: ITraceTelemetryFilter;

  /**
   * Optional filter function called before sending exceptions to Application Insights.
   * Return false to prevent the exception from being sent. Useful for filtering out known/expected errors.
   */
  exceptionFilter?: IExceptionTelemetryFilter;

  /**
   * Custom function to determine what objects should be treated as errors.
   * Defaults to checking `obj instanceof Error`. Objects identified as errors are extracted from log
   * parameters and sent as Application Insights exceptions. When the first parameter is an Error,
   * only an exception is sent (no trace) to avoid duplicate telemetry.
   */
  isError?: IsError;
  level?: string;
} & CreateTelemetryHandlerOptions;

export interface WinstonLevels {
  [levelName: string]: number;
}

export interface WinstonColors {
  [colorName: string]: string;
}

export type WinstonTransportOptionsFormat = {
  /**
   * Output format for log messages.
   * 'json' produces structured JSON output ({@link https://github.com/winstonjs/logform#json}),
   * 'simple' produces human-readable text ({@link https://github.com/winstonjs/logform#simple}).
   * @default 'json'
   */
  output?: 'json' | 'simple';

  /**
   * Whether to include error stack traces in log output ({@link https://github.com/winstonjs/logform#errors}).
   * Use boolean for simple enable/disable, or object to control stack inclusion.
   * @default { stack: true }
   */
  errors?:
    | boolean
    | {
        /**
         * Whether to include stack traces when logging Error objects.
         * @default true
         */
        stack?: boolean;
      };

  /**
   * Whether to include timestamps in log output ({@link https://github.com/winstonjs/logform#timestamp}).
   * Use boolean for default ISO format, or object to customise timestamp format.
   * @default true
   */
  timestamp?: boolean | TimestampOptions;

  /**
   * Whether to colorize log output for terminal display ({@link https://github.com/winstonjs/logform#colorize}).
   * When used with 'json' output, automatically unescapes ANSI color codes for proper display.
   * @default true
   */
  colorize?: boolean | ColorizeOptions;
};

export interface WinstonLoggerDefaults {
  /**
   * Minimum log level for the logger.
   * @default 'info'
   */
  level?: string;

  /**
   * Default metadata to include with all log entries.
   */
  defaultMeta?: Record<string, unknown>;

  /**
   * Global formats applied to all transports.
   * These are applied first, before any transport-specific formats.
   */
  format?: Format[];
}

export interface WinstonBaseTransportOptions extends WinstonLoggerDefaults {
  /**
   * Whether this transport is enabled.
   * @default true for insights transport, auto-detected for console (true locally, false in Azure)
   */
  enabled?: boolean;
}

export interface WinstonConsoleTransportOptions extends Omit<WinstonBaseTransportOptions, 'format'> {
  /**
   * Format configuration for this transport.
   * If provided as Format[] ({@link https://github.com/winstonjs/logform#formats}), it is used as-is without any additional processing.
   * Use WinstonTransportOptionsFormat for simplified configuration with automatic format handling.
   */
  format?: Format[] | WinstonTransportOptionsFormat;
}

export interface WinstonInsightsTransportOptions extends WinstonBaseTransportOptions {
  // Inherits enabled, level, format, and defaultMeta from WinstonBaseTransportOptions
}

export interface WinstonLoggerOptions {
  /**
   * Silence the logger (no output).
   * @default false
   */
  silent?: boolean;

  /**
   * Exit on error.
   * @default true
   */
  exitOnError?: boolean | ((error: Error) => boolean);

  /**
   * Handle exceptions.
   * @default false
   */
  handleExceptions?: boolean;

  /**
   * Handle rejections.
   * @default false
   */
  handleRejections?: boolean;
}

export type CreateWinstonLoggerOptions = {
  winston?: {
    /**
     * Custom log levels definition.
     * @default winston.config.npm.levels
     */
    levels?: WinstonLevels;

    /**
     * Custom colors for log levels.
     */
    colors?: WinstonColors;

    /**
     * Additional winston logger options.
     */
    options?: WinstonLoggerOptions;

    /**
     * Default settings applied to the logger.
     */
    defaults?: WinstonLoggerDefaults;

    /**
     * Console transport configuration.
     */
    console?: WinstonConsoleTransportOptions;

    /**
     * Application Insights transport configuration.
     * Format is managed automatically and cannot be overridden.
     */
    insights?: WinstonInsightsTransportOptions;
  };
  /**
   * Application Insights transport configuration (required).
   */
  insights: CreateApplicationInsightsTransportOptions;
};
