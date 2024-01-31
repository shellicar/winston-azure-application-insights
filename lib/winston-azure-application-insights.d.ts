declare module "winston-azure-application-insights" {
  import type * as appInsights from "applicationinsights";
  import type Transport from "winston-transport";
  type AzureApplicationInsightsLoggerProps = {
    client?: appInsights.TelemetryClient;
    insights?: typeof appInsights;
    key?: string;
    sendErrorsAsExceptions?: boolean;
    level?:
      | "debug"
      | "info"
      | "emerg"
      | "alert"
      | "crit"
      | "error"
      | "warning"
      | "warn"
      | "notice"
      | "verbose"
      | "silly";
  } & Transport.TransportStreamOptions;

  export class AzureApplicationInsightsLogger extends Transport {
    constructor(options?: AzureApplicationInsightsLoggerProps);
  }
}
