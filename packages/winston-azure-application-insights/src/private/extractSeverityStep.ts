import { TelemetrySeverity } from '../public/enums';
import type { SeverityMapping, WinstonLevels } from '../public/types';
import type { WinstonInfo } from './types';

export const extractSeverityStep = (info: WinstonInfo, severityMapping: SeverityMapping, levels?: WinstonLevels): TelemetrySeverity => {
  const directMapping = severityMapping[info.level];
  if (directMapping != null) {
    return directMapping;
  }

  if (levels != null) {
    const currentPriority = levels[info.level];

    if (currentPriority != null) {
      const sortedLevels = Object.entries(levels)
        .map((x) => ({ levelName: x[0], priority: x[1] }))
        .filter((x) => currentPriority < x.priority)
        .sort((a, b) => a.priority - b.priority);

      for (const { levelName } of sortedLevels) {
        const severity = severityMapping[levelName];
        if (severity) {
          return severity;
        }
      }
    }
  }

  return TelemetrySeverity.Verbose;
};
