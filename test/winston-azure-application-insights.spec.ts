import { doesNotThrow, equal, ok } from 'node:assert/strict';
import { KnownSeverityLevel, TelemetryClient, defaultClient, setup } from 'applicationinsightsv3';
import td from 'testdouble';
import { type Logger, config, createLogger, format } from 'winston';
import { AzureApplicationInsightsLogger } from '../src/winston-azure-application-insights';

type WinstonLogLevels = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

const fakeKey = '00000000-0000-0000-0000-000000000000';
const fakeConnString = `InstrumentationKey=${fakeKey}`;

describe('winston-azure-application-insights', () => {
  describe('class', () => {
    describe('constructor', () => {
      beforeEach(() => {
        process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = undefined;
      });

      it('should accept an App Insights client with the client option', () => {
        let aiLogger: AzureApplicationInsightsLogger;

        doesNotThrow(() => {
          aiLogger = new AzureApplicationInsightsLogger({
            version: 3,
            client: new TelemetryClient(fakeConnString),
          });
        });

        ok(aiLogger!.client);
      });

      it('should set default logging level to info', () => {
        const aiLogger = new AzureApplicationInsightsLogger({
          version: 3,
          client: null!,
        });

        equal(aiLogger.level, 'info');
      });

      it('should set logging level', () => {
        const aiLogger = new AzureApplicationInsightsLogger({
          version: 3,
          client: null!,
          defaultLevel: 'warn',
        });

        equal(aiLogger.level, 'warn');
      });

      it('should declare a Winston logger', () => {
        const theTransport = new AzureApplicationInsightsLogger({
          version: 3,
          client: null!,
        });

        ok(theTransport);
      });
    });

    describe('#log', () => {
      let logger: Logger;
      let aiTransport: AzureApplicationInsightsLogger;
      let clientMock: testdouble.DoubledObject<TelemetryClient>;

      beforeEach(() => {
        setup(fakeConnString);
        clientMock = td.object(defaultClient);
        aiTransport = new AzureApplicationInsightsLogger({
          version: 3,
          client: clientMock,
        });
        logger = createLogger({
          transports: [aiTransport],
        });
      });

      afterEach(() => {
        td.reset();
      });

      it('should log with correct log levels', () => {
        const levelMapping = {
          error: KnownSeverityLevel.Error,
          warn: KnownSeverityLevel.Warning,
          info: KnownSeverityLevel.Information,
          verbose: KnownSeverityLevel.Verbose,
          debug: KnownSeverityLevel.Verbose,
          silly: KnownSeverityLevel.Verbose,
        } as const satisfies Record<WinstonLogLevels, KnownSeverityLevel>;

        aiTransport.level = 'silly';

        for (const level of Object.keys(levelMapping) as WinstonLogLevels[]) {
          logger.log(level, level);
          td.verify(clientMock.trackTrace(td.matchers.contains({ message: level, severity: levelMapping[level] })), { times: 1 });
          td.reset();
        }
      });

      it('should handle null/undefined messages', () => {
        for (const message of [null, undefined]) {
          logger.log('info', message);
          td.verify(clientMock.trackTrace(td.matchers.contains({ message: String(message), severity: KnownSeverityLevel.Information })));
        }
      });

      it('should pass object params if an object', () => {
        class CustomObject {
          constructor(public value: string) {}

          toString() {
            return `Custom toString - ${this.value}`;
          }
        }

        const customObj = new CustomObject('value');
        const date = new Date(2021, 1, 1);

        for (const message of [customObj, date]) {
          logger.log('info', message);
          td.verify(clientMock.trackTrace(td.matchers.contains({ properties: td.matchers.contains({ value: 'value' }) })));
        }
      });
    });

    describe('#log errors as exceptions', () => {
      let logger: Logger;
      let aiTransport: AzureApplicationInsightsLogger;
      let clientMock: testdouble.DoubledObject<TelemetryClient>;

      beforeEach(() => {
        setup(fakeConnString);
        clientMock = td.object(defaultClient);
        aiTransport = new AzureApplicationInsightsLogger({
          version: 3,
          client: clientMock,
          sendErrorsAsExceptions: true,
        });
        logger = createLogger({
          levels: config.syslog.levels,
          transports: [aiTransport],
        });
      });

      afterEach(() => {
        td.reset();
      });

      it('should not track exceptions if the option is off', () => {
        aiTransport.sendErrorsAsExceptions = false;
        logger.error('error message');
        td.verify(clientMock.trackException(td.matchers.anything()), { times: 0 });
      });

      it('should track exceptions if level == error and msg is an Error object', () => {
        const error = new Error('error msg');
        logger.error(error);
        td.verify(clientMock.trackException(td.matchers.contains({ exception: error, properties: {} })));
      });

      it('should track exceptions if level == error and meta is an Error object', () => {
        const error = new Error('Error message');
        logger.error('Log handling message', error);
        td.verify(clientMock.trackException(td.matchers.contains({ exception: error, properties: td.matchers.anything() })));
      });
    });

    describe('#formatter properties', () => {
      let logger: Logger;
      let aiTransport: AzureApplicationInsightsLogger;
      let clientMock: testdouble.DoubledObject<TelemetryClient>;
      const TEST_EXTRA_INFO = {
        my_app_version: '1.0.0-testsuite',
      };

      const addTestAppVersions = format((info) => Object.assign(info, TEST_EXTRA_INFO));

      beforeEach(() => {
        setup(fakeConnString);
        clientMock = td.object(defaultClient);
        aiTransport = new AzureApplicationInsightsLogger({
          version: 3,
          client: clientMock,
        });
        logger = createLogger({
          transports: [aiTransport],
          format: format.combine(addTestAppVersions(), format.json()),
        });
      });

      afterEach(() => {
        td.reset();
      });

      it('appends my_app_version to the trace properties', () => {
        logger.info('Test message');
        td.verify(clientMock.trackTrace(td.matchers.contains({ message: 'Test message', properties: TEST_EXTRA_INFO })));
      });
    });
  });
});
