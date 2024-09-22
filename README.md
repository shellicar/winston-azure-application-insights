@shellicar/winston-azure-application-insights
==================================

## Update

This has been forked as the original and other forks have not been updated in quite a while.

Most of this README has been left as is, with relevant updates only.

## Intro

An [Azure Application Insights][0] transport for [Winston][1] logging library.

This transport is designed to make it easy to obtain a reference to a standard logging library that broadcasts to Application Insights.

Your logging interface can remain familiar to standard (`logger.info`, `logger.error` etc) without intertwining any Azure-specific implementation detail. 

**[Read the project changelog](./CHANGELOG.md)**  

## Installation

```sh
pnpm install @shellicar/winston-azure-application-insights
```

## Support

This library has CJS and ESM outputs.

Continuous integration tests are run against the NodeJS LTS versions.

## Usage

See `demo.ts` and the `examples` directory for a usage examples.

**Connection String**

**Note**: an connection string is required before any data can be sent. Please see the
"[Connection Strings in Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/sdk-connection-string?tabs=dotnet5#find-your-connection-string)"
for more information.

The connection string can be supplied:

* Passing an initialized Application Insights client in the "client" options property:

```typescript
import { setup, defaultClient } from 'applicationinsights';
import { AzureApplicationInsightsLogger } from '@shellicar/winston-azure-application-insights';

setup().start();

const insightsLogger = new AzureApplicationInsightsLogger({
  client: defaultClient,
});
```
```cjs
const { setup, defaultClient } = require("applicationinsights");
const { AzureApplicationInsightsLogger } = require('@shellicar/winston-azure-application-insights');

setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const insightsLogger = new AzureApplicationInsightsLogger({
  client: defaultClient,
});
```

**I get an error when using this transport**

If you receive the error:

`No instrumentation key or connection string was provided to the Azure Monitor Exporter`

Then you didn't specify a suitable instrumentation key. See the section above.

`Error: @opentelemetry/api: Attempted duplicate registration of API: context`

This may be because your environment has already (maybe implicitly) loaded applicationinsights and called `.setup()`.
This happens if you are running an Azure Function App and have `APPLICATIONINSIGHTS_CONNECTION_STRING` set.
The best solution to this is to load `applicationinsights` and pass in `appInsights.defaultClient` using the `client`
option as per example.

**I'm seeing multiple traces with similar/identical messages**

`applicationinsights` deeply integrates into the `console` transports, and `winston` itself (via `diagnostic-channel`).
If you are integrating this transport, it's recommended to disable `diagnostic-channel` and console auto collection:

To control `diagnostic-channel`, [follow the guide in the main repository](https://github.com/Microsoft/ApplicationInsights-node.js#automatic-third-party-instrumentation).

It is recommended to use _only_ this transport where your application is running in production mode and needs to
stream data to Application Insights. In all other scenarios such as local debug and test suites, the console transport
(or similar) should suffice. This is to avoid polluting instances/unnecessary cost.

Despite this notice, to specifically disable console transport collection, use `.setAutoCollectConsole(false)`:

```js
setup().setAutoCollectConsole(false);
```

## Options

* **level**: lowest logging level transport to be logged (default: `info`)
* **sendErrorsAsExceptions**: Boolean flag indicating whether to also track errors to the AI exceptions table.
See section below for more details (default: `true`).

**SDK integration options (required):**

* **client**: An existing App Insights client

## Log Levels

Supported log levels are:

Winston Level | App Insights level
---------------|------------------
error          | error (3)
warn           | warning (2)
info           | informational (1)
verbose        | verbose (0)
debug          | verbose (0)
silly          | verbose (0)

**All other possible levels, or custom levels, will default to `info`**

[0]: https://azure.microsoft.com/en-us/services/application-insights/
[1]: https://github.com/winstonjs/winston

## Error & Exception Logging: Exceptions vs. Traces

The Application Insights "exceptions" table allows you to see more detailed error information including the stack trace.
Therefore for all log events at severity level error or above, an exception is logged if the library detects that an
Error object has been passed.
The log event will still generate a trace with the correct severity level regardless of this setting, but please note
that any Error object will have its `stack` property omitted when sent to `trackTrace`.
All other properties are included.

This allows you to see clearly Azure Application Insights instead of having to access trace information manually and set
up alerts based on the related metrics.

How it works with `sendErrorsAsExceptions: true`:

* `logger.error('error message');` creates a trace with severity level 3; *no* exception is tracked
* `logger.error(new Error('error message'));` creates a trace with severity level 3, *and* an exception with the Error object as argument
* `logger.error('error message', new Error('error message'));` creates a trace with severity level 3, *and* an exception with the Error object as argument
* `logger.error(new Error('error message'), logContext);` creates a trace and exception and logContext is set to the customDimensions (properties) track* field
* `logger.info(new Error('error message'));` creates a trace with severity level 1; *no* exception is tracked

If you do not wish to track exceptions, you can set the option `sendErrorsAsExceptions: false` when configuring the transport.
