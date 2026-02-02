import { ApplicationInsightsVersion, createWinstonLogger } from '@shellicar/winston-azure-application-insights';
import applicationinsights from 'applicationinsights';

// By default uses process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
applicationinsights.setup().start();

const logger = createWinstonLogger({
  insights: {
    version: ApplicationInsightsVersion.V3,
    client: applicationinsights.defaultClient,
    traceFilter: (trace) => {
      console.log('Telemetry message:', trace.message);
      console.log('Telemetry properties:', trace.properties);
      return true;
    },
  },
});

logger.info('Hello World');

// New in 6.1.0: String arguments no longer block property extraction
logger.info('Hello', 'World', { teapot: 'short and stout' });

// Multiple objects are now merged (last wins on collision)
logger.info('Multiple objects', { userId: 123 }, { sessionId: 'abc-456' });
logger.info('Collision example', { field: 'first' }, { field: 'second' }, { field: 'last wins' });
logger.info('Why', 'hello', 'there', { class: 'magician' });
logger.info('Hello', { message: 'World' });
logger.info('Hello', new Error('World'));
