import type { Format } from 'logform';
import { createLogger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import type { NodeClient } from './types';
import { AzureApplicationInsightsLogger } from './winston-azure-application-insights';

export const isRunningInAzure = () => {
  return process.env.WEBSITE_INSTANCE_ID !== undefined;
};
export const isRunningLocally = () => {
  return !isRunningInAzure();
};

export const createWinstonLogger = (client: NodeClient, ...fmt: Format[]) => {
  const _transports: TransportStream[] = [
    new AzureApplicationInsightsLogger({
      client,
    }),
  ];

  if (process.env.WEBSITE_INSTANCE_ID === undefined) {
    _transports.push(
      new transports.Console({
        // format: format.combine(
        //   format.errors({ stack: true }),
        //   format.json()),
        format: format.json(),
        stderrLevels: ['error', 'crit', 'alert', 'emerg'],
        consoleWarnLevels: ['warn', 'warning'],
      }),
    );
  }

  const _format = format.combine(...fmt, format.json());

  return createLogger({
    // format: _format,
    transports: _transports,
  });
};
