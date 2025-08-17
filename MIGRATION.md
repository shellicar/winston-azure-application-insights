# Migration Guide: v5.x → v6.x

This guide helps you migrate from v5.x to v6.x of `@shellicar/winston-azure-application-insights`.

## Overview

v6.x is a significant update that improves error handling, simplifies configuration, and enhances type safety. The main changes are:

- **Enum-based versioning** for better type safety (`version: 3` → `ApplicationInsightsVersion.V3`)
- **Simplified configuration** with removal of redundant options
- **Enhanced error handling** with automatic Error object detection
- **Restructured filtering** with separate trace and exception filters
- **Better Winston integration** with cleaner configuration structure

Most users will need to update imports, change the version parameter, and adjust a few configuration options.

**Note**: If you only use the transport directly (`new AzureApplicationInsightsLogger()`), see the [Transport-Only Migration](#transport-only-migration) section for a simpler migration path.

## Details

### Removed Options

- `sendErrorsAsExceptions` - functionality now automatic (always enabled)

### Moved Options  

- `defaultLevel` → `winston.defaults.level`
- `silent` → `winston.insights.enabled` (inverted logic: `silent: false` becomes `enabled: true`)

### Renamed Options

- `levels` → `severityMapping` (with enum values instead of numbers)
- `filters` → split into `traceFilter` and `exceptionFilter` functions

### Updated Imports

- Remove `ITelemetryFilterV3` interface
- Add `ApplicationInsightsVersion` and `TelemetrySeverity` enums

### Configuration Structure Changes

- `winston.console: true` → `winston.console: { enabled: true }`
- `winston.defaultMeta` → `winston.defaults.defaultMeta`
- Format configuration moved to transport-specific objects

### New Features

- Transport-specific log levels (`winston.insights.level`)
- Enhanced error separation (Error objects sent as exceptions)
- Improved severity mapping (fixes `undefined` severity issues)

## Guide

### Step 1: Update Package

```bash
pnpm add @shellicar/winston-azure-application-insights@^6
```

### Step 2: Update Imports

```typescript
// Remove
import { ITelemetryFilterV3 } from '@shellicar/winston-azure-application-insights';

// Add  
import { ApplicationInsightsVersion, TelemetrySeverity } from '@shellicar/winston-azure-application-insights';
```

### Step 3: Update Version Parameter

```typescript
// Change
version: 3,

// To
version: ApplicationInsightsVersion.V3,
```

### Step 4: Handle Removed and Moved Options

```typescript
// Remove this option (functionality is now automatic):
sendErrorsAsExceptions: true,  // Delete - now always enabled

// Move these options to new locations:
silent: false,                // Move to winston.insights.enabled: true
defaultLevel: 'info',         // Move to winston.defaults.level: 'info'
```

### Step 5: Update Severity Mapping

```typescript
// Change
levels: {
  info: 3,
},

// To
severityMapping: {
  info: TelemetrySeverity.Error,
},
```

### Step 6: Split Filter Functions

```typescript
// Change
const filter = {
  filterTrace: (trace) => true,
  filterException: (exception) => true,
};
filters: [filter],

// To
traceFilter: (trace) => true,
exceptionFilter: (exception) => true,
```

### Step 7: Update Winston Configuration

```typescript
// If you have console: true
winston: {
  console: true,
  // ... other options
}
// Change to:
winston: {
  console: { enabled: true },
  // ... other options
}

// If you have defaultMeta at top level
winston: {
  defaultMeta: { ... },
  // ... other options
}
// Move to:
winston: {
  defaults: {
    defaultMeta: { ... },
  },
  // ... other options
}

// If you used insights.defaultLevel
winston: {
  defaults: {
    level: 'info',        // Add this if you had insights.defaultLevel
  },
}

// If you used insights.silent
winston: {
  insights: {
    enabled: true,        // Add this if you had insights.silent: false
  },
}
```

### Step 8: Test and Verify

```bash
# Check for TypeScript errors
tsc --noEmit --composite false --skipLibCheck

# Run your application and test logging behavior
```

## Comparison

### Before (v5.x)

```typescript
import applicationinsights, { KnownSeverityLevel } from 'applicationinsights';
import { createWinstonLogger, ITelemetryFilterV3 } from '@shellicar/winston-azure-application-insights';
import winston from 'winston';

applicationinsights.setup().start();

const filter = {
  filterException(trace) {
    console.log('Filtering exception:', trace);
    return true;
  },
  filterTrace(trace) {
    console.log('Filtering trace:', trace);
    return true;
  },
} satisfies ITelemetryFilterV3;

const logger = createWinstonLogger({
  insights: {
    client: applicationinsights.defaultClient,
    version: 3,
    defaultLevel: 'info',
    filters: [filter],
    levels: {
      info: 3,
      error: 4,
    },
    sendErrorsAsExceptions: true,
    silent: false,
  },
  winston: {
    console: true,
    defaultMeta: {
      myDefault: 'meta',
    },
    format: [winston.format.timestamp(),  winston.format.errors(), winston.format.json()],
    level: 'verbose',
    levels: winston.config.npm.levels,
  }
});

logger.info('This is an info message');
logger.error('This is an error message', new Error('Test error'));
```

### After (v6.x)

```typescript
import applicationinsights from 'applicationinsights';
import { createWinstonLogger, ITraceTelemetryFilter, IExceptionTelemetryFilter, ApplicationInsightsVersion, TelemetrySeverity } from '@shellicar/winston-azure-application-insights';
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
  }
});

logger.info('This is an info message');
logger.error('This is an error message', new Error('Test error'));
```

## Migration Checklist

- [ ] Update package version to v6.x
- [ ] Update imports (add enums, remove old interfaces)
- [ ] Change `version: 3` to `ApplicationInsightsVersion.V3`
- [ ] Remove `sendErrorsAsExceptions`, `silent`, `defaultLevel` options
- [ ] Rename `levels` to `severityMapping` with enum values
- [ ] Split `filters` into `traceFilter` and `exceptionFilter`
- [ ] Update Winston configuration structure
- [ ] Test logging and error handling behavior

## Transport-Only Migration

If you're only using the transport directly (not the full logger factory), the migration is simpler:

### Before (v5.x)

```typescript
import applicationinsights from 'applicationinsights';
import { AzureApplicationInsightsLogger, ITelemetryFilterV3 } from '@shellicar/winston-azure-application-insights';

applicationinsights.setup().start();

const filter = {
  filterException(trace) {
    console.log('Filtering exception:', trace);
    return true;
  },
  filterTrace(trace) {
    console.log('Filtering trace:', trace);
    return true;
  },
} satisfies ITelemetryFilterV3;

const transport = new AzureApplicationInsightsLogger({
  client: applicationinsights.defaultClient,
  version: 3,
  defaultLevel: 'info',
  filters: [filter],
  levels: {
    info: 3,
    error: 4,
  },
  sendErrorsAsExceptions: true,
  silent: false,
});
```

### After (v6.x)

```typescript
import applicationinsights from 'applicationinsights';
import { createApplicationInsightsTransport, ITraceTelemetryFilter, IExceptionTelemetryFilter, ApplicationInsightsVersion, TelemetrySeverity } from '@shellicar/winston-azure-application-insights';

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
```

### Key Changes for Transport-Only Users

1. **Class to factory**: `new AzureApplicationInsightsLogger()` → `createApplicationInsightsTransport()`
2. **Import changes**: Same enum imports as full migration
3. **Field renames**: Same as full migration (`levels` → `severityMapping`, etc.)
4. **Filter interface**: Object with methods → separate function parameters
5. **Removed options**: `sendErrorsAsExceptions`, `silent`, `defaultLevel`

## Troubleshooting

### TypeScript Errors

**Error**: `Property 'ITelemetryFilterV3' does not exist`\
**Solution**: Remove the import and use direct functions instead

**Error**: `Type 'number' is not assignable to type 'ApplicationInsightsVersion'`\
**Solution**: Use `ApplicationInsightsVersion.V3` instead of `3`

**Error**: `Property 'levels' does not exist`\
**Solution**: Rename to `severityMapping` and use `TelemetrySeverity` enum values

### Runtime Errors

**Error**: `winston.console is not a function`\
**Solution**: Change `winston: { console: true }` to `winston: { console: { enabled: true } }`

## Need Help?

- Check the [examples](./examples) directory for working code samples
- Review the [README](./README.md) for detailed API documentation
- [Open an issue](https://github.com/shellicar/winston-azure-application-insights/issues) for migration problems
