import { TelemetrySeverity } from './enums';
import type { SeverityMapping } from './types';

export const defaultSeverityMapping: SeverityMapping = {
  error: TelemetrySeverity.Error,
  warn: TelemetrySeverity.Warning,
  info: TelemetrySeverity.Information,
  verbose: TelemetrySeverity.Verbose,
};
