# Changelog

## [6.0.4] - 2026-02-28

### Security

- Fix [GHSA-7h2j-956f-4vf2](https://github.com/advisories/GHSA-7h2j-956f-4vf2) in brace-expansion
- Fix [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) in minimatch
- Fix [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) in minimatch
- Fix [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74) in minimatch
- Fix [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) in rollup
- Fix [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) in lodash

### Changed

- Removed unused `applicationinsightsv34` alias
- Updated development dependencies

## [6.0.3] - 2025-12-26

### Changes

- Updated all dependencies to latest versions

## [6.0.2] - 2025-10-24

### Changes

- Concatenate all string parameters into Trace message

```ts
logger.info('Hello', 'there', 'world')
// message: 'Hello there world'
```

## [6.0.1] - 2025-10-24

### Changes

- Updated all dependencies to latest versions

## [6.0.0] - 2025-09-19

### Breaking Changes

Complete ground-up rewrite of the library with new architecture, API, and approach to logging.

#### New Factory-Based API

**Before (v5.x):**

```typescript
import { AzureApplicationInsightsLogger } from '@shellicar/winston-azure-application-insights';

const logger = winston.createLogger({
  transports: [
    new AzureApplicationInsightsLogger({
      version: 3,
      client: defaultClient,
      sendErrorsAsExceptions: true,
    })
  ]
});
```

**After (v6.x):**

```typescript
import { createApplicationInsightsTransport, createWinstonLogger } from '@shellicar/winston-azure-application-insights';

// Option 1: Transport factory
const transport = createApplicationInsightsTransport({
  version: 3,
  client: defaultClient,
});

// Option 2: Complete logger factory
const logger = createWinstonLogger({
  winston: { console: true },
  insights: { version: 3, client: defaultClient },
});

// Option 3: Telemetry handler
const handler = createTelemetryHandler({
  version: 3,
  client: defaultClient,
});
const transport
```

#### Architecture Changes

- Replaced monolithic class with modular step-based processing pipeline
- Separate SDK-specific telemetry handlers for v2/v3 Application Insights
- Clean separation between Winston transport and Application Insights logic

#### API Changes

- **Removed**: `AzureApplicationInsightsLogger` class
- **Removed**: `sendErrorsAsExceptions` option (now automatic and smarter)
- **Removed**: `defaultLevel` option (use Winston's native configuration)
- **Removed**: `filters` array (replaced with separate filter functions)
- **Removed**: `silent` option (use Winston's native transport configuration)
- **Added**: `createApplicationInsightsTransport()` factory function
- **Added**: `createWinstonLogger()` factory function
- **Changed**: `levels` option renamed to `severityMapping`
- **Changed**: Filter functions now use separate `traceFilter`/`exceptionFilter` options

#### Extensibility Features

- **Custom Error Detection**: Implement your own `isError` function to define what counts as an error
- **Severity Mapping**: Override default Winston level to Application Insights severity mappings
- **Telemetry Filtering**: Apply custom filters to traces and exceptions before sending
- **Custom Telemetry Handlers**: Implement your own telemetry processing logic

### Added

- Factory functions for simpler setup
- Automatic Error object detection and extraction
- Smart error handling (Error as first parameter sends only exception)
- Multiple Error object support in single log call
- Object.create(null) support for GraphQL/Apollo compatibility
- Enhanced property extraction from splat parameters and defaultMeta
- Comprehensive test suite
- Extensible error detection with custom `isError` functions
- Customizable severity mapping for Winston levels
- Flexible trace and exception filtering
- Support for custom telemetry handlers

### Changed

- Complete rewrite
- Improved Winston behaviour compatibility
- Better error message handling
- Enhanced property extraction logic

---

## [5.1.0] - 2025-08-03

### Changes

- Updated all dependencies to latest versions

## [5.0.7]

### Fixes

- Fix incorrect App Insights severity.

## [5.0.6]

### Changes

- Update options and logging fields.

## [5.0.5]

### Changes

- Expose `level` for creating logger.

## [5.0.4]

### Changes

- Expose `defaultMeta` for helper function.

## [5.0.3]

### Changes

- Add more options for `createWinstonLogger` helper function.

## [5.0.2]

### Changes

- Add `ITelemetryFilter` to allow filtering traces and exceptions.
- Simplify `tsup` config.
- Fix applicationinsights dependencies.

## [5.0.1]

### Changes

- Fix dependencies.
- Use @biomejs/biome for linting.

## [5.0.0]

### Breaking Changes

- Update to applicationinsights `3.x`.
- Update to winston `3.x`.
- Use typescript.

## 4.0.0

### Breaking Changes

- Drops support for applicationinsights 1.x
- Minimum Node version is now 14

### Important notice

- If you are an open source maintainer wanting to adopt this repo, apply within!

## 3.0.0

### Breaking Changes

- **v3.0.0 now requires Node.js v8.17.0 or newer.**

### Enhancements

- Allow `log` to take `null` or `undefined` message parameters.

## 2.0.0

- Supports Winston 3.x (DROPS support for Winston 2.x)
- `silent` flag removed in favour of not configuring the transport
- `winston` and `applicationinsights` packages changed to `peerDependencies`
- Remove `fixNestedObjects` in favour of using the upstream `applicationinsights` libary's bugfix
- Remove `formatter` in favour of using `winston@3.x`'s formatter functionality
- Replace `treatErrorsAsExceptions` with `sendErrorsAsExceptions` following feedback from AI core team w/r best practice error tracking
- Package install size drastically reduced

[6.0.4]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/6.0.4
[6.0.3]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/6.0.3
[6.0.2]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/6.0.2
[6.0.1]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/6.0.1
[6.0.0]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/6.0.0
[5.1.0]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.1.0
[5.0.7]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.7
[5.0.6]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.6
[5.0.5]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.5
[5.0.4]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.4
[5.0.3]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.3
[5.0.2]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.2
[5.0.1]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.1
[5.0.0]: https://github.com/shellicar/winston-azure-application-insights/releases/tag/5.0.0
