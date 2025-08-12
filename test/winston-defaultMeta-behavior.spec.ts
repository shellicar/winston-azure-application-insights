import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger } from 'winston';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

describe('Winston defaultMeta behavior verification', () => {
  it('should show how Winston handles defaultMeta vs splat conflicts', () => {
    const spyTransport = new SpyWinstonTransport();
    const logger = createLogger({
      defaultMeta: { appVersion: '1.2.3', userId: 123 },
      transports: [spyTransport],
    });

    // Test conflict: defaultMeta has appVersion '1.2.3', splat has '2.3.4'
    logger.info('hello', { appVersion: '2.3.4', sessionId: 'abc' });

    const info = spyTransport.lastInfo;
    console.log('=== WINSTON DEFAULTMETA BEHAVIOR ===');
    console.log('DefaultMeta:', { appVersion: '1.2.3', userId: 123 });
    console.log('Splat arg:', { appVersion: '2.3.4', sessionId: 'abc' });
    console.log('Result info keys:', Object.keys(info));
    console.log('info.appVersion:', info.appVersion);
    console.log('info.userId:', info.userId);
    console.log('info.sessionId:', info.sessionId);
    console.log('Splat symbol:', info[SPLAT]);
    console.log('==============================');

    // Let's see what actually happens
    expect(info).toBeDefined();
  });

  it('should show Winston behavior with multiple splat objects', () => {
    const spyTransport = new SpyWinstonTransport();
    const logger = createLogger({
      defaultMeta: { userId: 123, appVersion: '1.0.0' },
      transports: [spyTransport],
    });

    // Multiple objects in splat
    logger.info('test message', { userId: 456 }, { sessionId: 'abc' });

    const info = spyTransport.lastInfo;
    console.log('=== WINSTON MULTIPLE OBJECTS ===');
    console.log('DefaultMeta:', { userId: 123, appVersion: '1.0.0' });
    console.log('Splat args:', [{ userId: 456 }, { sessionId: 'abc' }]);
    console.log('Result info keys:', Object.keys(info));
    console.log('info.userId:', info.userId);
    console.log('info.appVersion:', info.appVersion);
    console.log('info.sessionId:', info.sessionId);
    console.log('Splat symbol:', info[SPLAT]);
    console.log('==============================');

    expect(info).toBeDefined();
  });

  it('should show Winston behavior with mixed types in splat', () => {
    const spyTransport = new SpyWinstonTransport();
    const logger = createLogger({
      defaultMeta: { userId: 123, appVersion: '1.0.0' },
      transports: [spyTransport],
    });

    // Mixed types: string, number, object
    logger.info('test message', 'additional-data', 42, { contextId: 'ctx-123' });

    const info = spyTransport.lastInfo;
    console.log('=== WINSTON MIXED TYPES ===');
    console.log('DefaultMeta:', { userId: 123, appVersion: '1.0.0' });
    console.log('Splat args:', ['additional-data', 42, { contextId: 'ctx-123' }]);
    console.log('Result info keys:', Object.keys(info));
    console.log('info.userId:', info.userId);
    console.log('info.appVersion:', info.appVersion);
    console.log('info.contextId:', info.contextId);
    console.log('Splat symbol:', info[SPLAT]);
    console.log('==============================');

    expect(info).toBeDefined();
  });
});
