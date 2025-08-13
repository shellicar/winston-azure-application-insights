# @shellicar/winston-azure-application-insights

> An [Azure Application Insights](https://azure.microsoft.com/en-us/services/application-insights/) transport for [Winston](https://github.com/winstonjs/winston) logging library.

[![npm package](https://img.shields.io/npm/v/@shellicar/winston-azure-application-insights.svg)](https://npmjs.com/package/@shellicar/winston-azure-application-insights)
[![build status](https://github.com/shellicar/winston-azure-application-insights/actions/workflows/node.js.yml/badge.svg)](https://github.com/shellicar/winston-azure-application-insights/actions/workflows/node.js.yml)

## Features

• 🔄 **Dual SDK Support** - Works with both Application Insights v2 and v3 SDKs
• 🚀 **Simple Factory Functions** - Easy setup with `createApplicationInsightsTransport()` and `createWinstonLogger()`  
• 🔍 **Automatic Error Detection** - Extracts Error objects from logs and sends them as Application Insights exceptions
• 📊 **Trace + Exception Logging** - Sends logs as traces while also tracking errors as detailed exceptions
• 🎯 **Flexible Filtering** - Optional trace and exception filters for fine-grained control
• 🔧 **Custom Severity Mapping** - Map Winston levels to Application Insights severity levels
• 🏠 **Local Development** - Log to console locally while sending to Application Insights in production

## Installation & Quick Start

```sh
pnpm add @shellicar/winston-azure-application-insights
```

```typescript
import { setup, defaultClient } from 'applicationinsights';
import { createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import { createLogger } from 'winston';

setup().start();

const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});

const logger = createLogger({
  transports: [transport],
});

logger.info('Hello Application Insights!');
logger.error('Something failed', new Error('Connection timeout'));
```

<!-- BEGIN_ECOSYSTEM -->

## @shellicar TypeScript Ecosystem

### Core Libraries

- [`@shellicar/core-config`](https://github.com/shellicar/core-config) - A library for securely handling sensitive configuration values like connection strings, URLs, and secrets.
- [`@shellicar/core-di`](https://github.com/shellicar/core-di) - A basic dependency injection library.

### Reference Architectures

- [`@shellicar/reference-foundation`](https://github.com/shellicar/reference-foundation) - A comprehensive starter repository. Illustrates individual concepts.
- [`@shellicar/reference-enterprise`](https://github.com/shellicar/reference-enterprise) - A comprehensive starter repository. Can be used as the basis for creating a new Azure application workload.

### Build Tools

- [`@shellicar/build-version`](https://github.com/shellicar/build-version) - Build plugin that calculates and exposes version information through a virtual module import.
- [`@shellicar/build-graphql`](https://github.com/shellicar/build-graphql) - Build plugin that loads GraphQL files and makes them available through a virtual module import.

### Framework Adapters

- [`@shellicar/svelte-adapter-azure-functions`](https://github.com/shellicar/svelte-adapter-azure-functions) - A [SvelteKit adapter](https://kit.svelte.dev/docs/adapters) that builds your app into an Azure Function.

### Logging & Monitoring

- [`@shellicar/winston-azure-application-insights`](https://github.com/shellicar/winston-azure-application-insights) - An [Azure Application Insights](https://azure.microsoft.com/en-us/services/application-insights/) transport for [Winston](https://github.com/winstonjs/winston) logging library.
- [`@shellicar/pino-applicationinsights-transport`](https://github.com/shellicar/pino-applicationinsights-transport) - [Azure Application Insights](https://azure.microsoft.com/en-us/services/application-insights) transport for [pino](https://github.com/pinojs/pino)

<!-- END_ECOSYSTEM -->

## Motivation

When logging directly to Application Insights using the telemetry client, it makes debugging locally more difficult. Logging to console pollutes logs in Azure, so this provides a compromise.

I forked the original library to add support for Application Insights v3, which is relatively recent. I have also refactored it to handle certain error logging scenarios that weren't working as expected.

## Feature Examples

See [examples](./examples) for example source code.

- **Factory Functions** - Simple setup with clean API.

```typescript
import { setup, defaultClient } from 'applicationinsights';
import { createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';

setup().start();

const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});
```

- **Complete Logger Setup** - Create a Winston logger with both console and Application Insights.

```typescript
import { createWinstonLogger } from '@shellicar/winston-azure-application-insights';

const logger = createWinstonLogger({
  winston: {
    console: true,
    level: 'info',
  },
  insights: {
    version: 3,
    client: defaultClient,
  },
});

logger.info('Application started');
```

- **Error Extraction** - Automatically detects Error objects and sends them as exceptions.

```typescript
// Creates trace only
logger.error('Something went wrong');

// Creates EXCEPTION ONLY (no trace) - when first parameter is Error
logger.error(new Error('Database error'));

// Creates trace + exception (Error extracted from additional parameters)
logger.error('Operation failed', new Error('Timeout'));

// Creates trace + two exceptions (multiple Error objects)
logger.error('Multiple failures', new Error('DB error'), new Error('Cache error'));
```

**Key Behavior:** When you log an Error as the first parameter (`logger.error(new Error())`), it sends **only the exception** to Application Insights, not a trace. This avoids duplicate telemetry.

- **Properties Extraction** - Winston splat parameters become telemetry properties.

```typescript
// Simple properties
logger.info('User logged in', { userId: 123, action: 'login' });

// Mixed types - Error objects are extracted, others become properties
logger.error('Complex operation failed', 
  { userId: 123, operation: 'checkout' }, 
  new Error('Payment failed'),
  { retryCount: 3 }
);
```

- **Severity Mapping** - Winston levels map to Application Insights severity with priority fallback.

```typescript
logger.error('Critical issue');   // → Error (3)
logger.warn('Warning message');   // → Warning (2)  
logger.info('Info message');      // → Information (1)
logger.verbose('Debug info');     // → Verbose (0)

// Custom levels fall back to next available mapping
logger.log('audit', 'Audit event'); // → Falls back based on level priority
```

- **Custom Severity Mapping** - Override default level mappings.

```typescript
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
  severityMapping: {
    error: TelemetrySeverity.Error,
    warn: TelemetrySeverity.Warning,
    info: TelemetrySeverity.Information,
    debug: TelemetrySeverity.Verbose,
    // Custom levels
    audit: TelemetrySeverity.Critical,
    security: TelemetrySeverity.Error,
  },
});
```

- **Dual SDK Support** - Works with both Application Insights v2 and v3.

```typescript
// Application Insights v2
import { setup, defaultClient } from 'applicationinsights'; // v2
const transport = createApplicationInsightsTransport({
  version: 2,
  client: defaultClient,
});

// Application Insights v3  
import { setup, defaultClient } from 'applicationinsightsv3'; // v3
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});
```

- **Filtering** - Optional filters for traces and exceptions.

```typescript
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
  // Filter out verbose traces
  traceFilter: (trace) => trace.severity !== KnownSeverityLevel.Verbose,
  // Skip exceptions for specific errors
  exceptionFilter: (exception) => !exception.exception.message.includes('ignore'),
});
```

- **Disable Exception Tracking** - Customize error detection logic.

```typescript
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
  // Custom function to determine what counts as an error
  isError: (obj) => obj instanceof CustomError,
});
```

## Usage

```typescript
import { setup, defaultClient } from 'applicationinsights';
import { createApplicationInsightsTransport } from '@shellicar/winston-azure-application-insights';
import { createLogger } from 'winston';

// Setup Application Insights
setup().start(); // Uses APPLICATIONINSIGHTS_CONNECTION_STRING environment variable

// Create transport
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});

// Create Winston logger
const logger = createLogger({
  transports: [transport],
});

// Log messages
logger.info('Application started', { version: '1.0.0' });
logger.error('Database connection failed', new Error('Connection timeout'), { 
  host: 'db.example.com',
  retryCount: 3 
});
```

### Connection String Setup

A connection string is required before any data can be sent. See [Connection Strings in Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/sdk-connection-string?tabs=dotnet5#find-your-connection-string) for more information.

```typescript
// Option 1: Environment variable (recommended)
process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=your-key-here';
setup().start();

// Option 2: Explicit connection string
setup('InstrumentationKey=your-key-here').start();
```

### Configuration Options

- **version**: `2` or `3` - Application Insights SDK version (required)
- **client**: Application Insights client instance (required)
- **isError**: Custom function to determine what counts as an error (default: detects Error instances)
- **severityMapping**: Custom Winston level to Application Insights severity mapping
- **traceFilter**: Optional function to filter traces before sending
- **exceptionFilter**: Optional function to filter exceptions before sending

### Troubleshooting

#### Missing Connection String

```txt
No instrumentation key or connection string was provided
```

Set the connection string via environment variable or setup parameter.

#### Duplicate API Registration

```txt
Attempted duplicate registration of API: context
```

Your environment already loaded Application Insights (common in Azure Functions). Use the existing client without calling setup():

```typescript
import { defaultClient } from 'applicationinsights';
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient, // Use existing client
});
```

#### Multiple/Duplicate Traces

Application Insights auto-collects from console and Winston. Disable auto-collection:

```typescript
setup().setAutoCollectConsole(false).start();
```
