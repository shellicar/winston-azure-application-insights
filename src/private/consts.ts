import { TelemetrySeverity } from '../public/enums';
import type { SeverityMapping } from '../public/types';

export const defaultSeverityMapping: SeverityMapping = {
  error: TelemetrySeverity.Error,
  warn: TelemetrySeverity.Warning,
  info: TelemetrySeverity.Information,
  verbose: TelemetrySeverity.Verbose,
};
