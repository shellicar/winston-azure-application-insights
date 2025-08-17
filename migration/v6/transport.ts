import { ApplicationInsightsVersion, type IExceptionTelemetryFilter, type ITraceTelemetryFilter, TelemetrySeverity, createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const traceFilter: ITraceTelemetryFilter = (trace) => {
  console.log('Filtering trace:', trace);
  return true;
};

const exceptionFilter: IExceptionTelemetryFilter = (exception) => {
  console.log('Filtering exception:', exception);
  return true;
};

const transport = createApplicationInsightsTransport({
  client: applicationinsights.defaultClient,
  version: ApplicationInsightsVersion.V3,
  severityMapping: {
    info: TelemetrySeverity.Error,
    error: TelemetrySeverity.Critical,
  },
  exceptionFilter,
  traceFilter,
  level: 'info',
});
