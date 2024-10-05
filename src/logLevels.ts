import { LogLevel, type LogLevels } from './types';

export const defaultLogLevels: LogLevels = {
  error: LogLevel.Error,
  warn: LogLevel.Warning,
  http: LogLevel.Information,
  info: LogLevel.Information,
  verbose: LogLevel.Verbose,
  debug: LogLevel.Verbose,
  silly: LogLevel.Verbose,
};
