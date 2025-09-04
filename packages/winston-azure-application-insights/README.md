# @shellicar/winston-azure-application-insights

An [Azure Application Insights](https://azure.microsoft.com/en-us/services/application-insights/) transport for [Winston](https://github.com/winstonjs/winston) logging library

## Installation & Quick Start

```sh
npm install @shellicar/winston-azure-application-insights
```

## Quick Example

```typescript
import { createWinstonLogger, ApplicationInsightsVersion } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V3,
    client: applicationinsights.defaultClient
  },
});

logger.info('Hello World');
logger.error('Something went wrong', new Error('Database connection failed'));
```

## Documentation

For full documentation, visit the [GitHub repository](https://github.com/shellicar/winston-azure-application-insights).
