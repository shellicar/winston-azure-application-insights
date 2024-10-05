import { type AzureLogLevels, LogLevel } from './types';

export const defaultLogLevels: AzureLogLevels = {
  error: LogLevel.Error,
  warn: LogLevel.Warning,
  http: LogLevel.Information,
  info: LogLevel.Information,
  verbose: LogLevel.Verbose,
  debug: LogLevel.Verbose,
  silly: LogLevel.Verbose,
};
