import { ApplicationInsightsVersion, type IExceptionTelemetryFilter, type ITraceTelemetryFilter, TelemetrySeverity, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';
import winston from 'winston';

applicationinsights.setup().start();

const traceFilter: ITraceTelemetryFilter = (trace) => {
  console.log('Filtering trace:', trace);
  return true;
};

const exceptionFilter: IExceptionTelemetryFilter = (exception) => {
  console.log('Filtering exception:', exception);
  return true;
};

const logger = createWinstonLogger({
  insights: {
    client: applicationinsights.defaultClient,
    version: ApplicationInsightsVersion.V3,
    severityMapping: {
      info: TelemetrySeverity.Error,
      error: TelemetrySeverity.Critical,
    },
    exceptionFilter,
    traceFilter,
  },
  winston: {
    console: {
      enabled: true,
      format: {
        output: 'json',
        colorize: true,
        errors: true,
        timestamp: true,
      },
    },
    defaults: {
      defaultMeta: {
        myDefault: 'meta',
      },
      level: 'verbose',
    },
    insights: {
      level: 'info',
    },
    levels: winston.config.npm.levels,
  },
});

logger.info('This is an info message');
logger.error('This is an error message', new Error('Test error'));
