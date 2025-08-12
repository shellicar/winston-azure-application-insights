import { SPLAT } from 'triple-beam';
import { describe, expect, it } from 'vitest';
import { createLogger, format } from 'winston';
import * as winston from 'winston';
import { SpyWinstonTransport } from './spies/SpyWinstonTransport';

describe('Winston defaultMeta behavior verification', () => {
  const captureTransport = new SpyWinstonTransport();

  it('should verify what Winston does with defaultMeta vs splat conflicts', () => {
    const logger = createLogger({
      defaultMeta: { appVersion: '1.2.3', userId: 123 },
      format: format.json(),
      transports: [captureTransport],
    });

    // Test case: defaultMeta property conflicts with splat
    logger.info('hello', { appVersion: '2.3.4', sessionId: 'abc' });

    const capturedInfo = captureTransport.capturedWinstonInfo[0];

    console.log('=== WINSTON BEHAVIOR VERIFICATION ===');
    console.log('defaultMeta:', { appVersion: '1.2.3', userId: 123 });
    console.log('splat item:', { appVersion: '2.3.4', sessionId: 'abc' });
    console.log('Winston info object:', JSON.stringify(capturedInfo, null, 2));
    console.log('Info keys:', Object.keys(capturedInfo));
    console.log('Splat symbol:', capturedInfo[SPLAT]);
    console.log('==========================================');

    // Log the actual behavior for manual inspection
    expect(capturedInfo).toBeDefined();
  });

  it('should verify Winston behavior with multiple splat items', () => {
    const logger = createLogger({
      defaultMeta: { appVersion: '1.2.3', userId: 123 },
      format: format.json(),
      transports: [captureTransport],
    });

    // Test case: multiple splat items
    logger.info('hello', { sessionId: 'abc' }, { requestId: 'req-123' }, 'extra-data');
    const capturedInfo = captureTransport.capturedWinstonInfo[0];

    console.log('=== WINSTON MULTIPLE SPLAT VERIFICATION ===');
    console.log('defaultMeta:', { appVersion: '1.2.3', userId: 123 });
    console.log('splat items:', [{ sessionId: 'abc' }, { requestId: 'req-123' }, 'extra-data']);
    console.log('Winston info object:', JSON.stringify(capturedInfo, null, 2));
    console.log('Info keys:', Object.keys(capturedInfo));
    console.log('Splat symbol:', capturedInfo[SPLAT]);
    console.log('===========================================');

    expect(capturedInfo).toBeDefined();
  });

  it('should verify Winston behavior with no splat', () => {
    const logger = createLogger({
      defaultMeta: { appVersion: '1.2.3', userId: 123 },
      format: format.json(),
      transports: [captureTransport],
    });

    // Test case: no splat, just message
    logger.info('hello world');
    const capturedInfo = captureTransport.capturedWinstonInfo[0];

    console.log('=== WINSTON NO SPLAT VERIFICATION ===');
    console.log('defaultMeta:', { appVersion: '1.2.3', userId: 123 });
    console.log('message only:', 'hello world');
    console.log('Winston info object:', JSON.stringify(capturedInfo, null, 2));
    console.log('Info keys:', Object.keys(capturedInfo));
    console.log('Splat symbol:', capturedInfo[SPLAT]);
    console.log('=====================================');

    expect(capturedInfo).toBeDefined();
  });

  // Exhaustive primitive defaultMeta tests
  describe('Primitive defaultMeta behavior', () => {
    it('should handle number defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: 42,
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== NUMBER DEFAULTMETA ===');
      console.log('defaultMeta:', 42);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('==========================');
    });

    it('should handle string defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: 'hello-world',
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== STRING DEFAULTMETA ===');
      console.log('defaultMeta:', 'hello-world');
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('===========================');
    });

    it('should handle boolean defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: true,
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== BOOLEAN DEFAULTMETA ===');
      console.log('defaultMeta:', true);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('============================');
    });

    it('should handle null defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: null,
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== NULL DEFAULTMETA ===');
      console.log('defaultMeta:', null);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('=========================');
    });

    it('should handle undefined defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: undefined,
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== UNDEFINED DEFAULTMETA ===');
      console.log('defaultMeta:', undefined);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('==============================');
    });

    it('should handle Date defaultMeta', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      const logger = createLogger({
        defaultMeta: testDate,
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== DATE DEFAULTMETA ===');
      console.log('defaultMeta:', testDate);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('=========================');
    });

    it('should handle array defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: [1, 2, 3],
        transports: [captureTransport],
      });
      logger.info('test message');
      const info = captureTransport.lastInfo;

      console.log('=== ARRAY DEFAULTMETA ===');
      console.log('defaultMeta:', [1, 2, 3]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('==========================');
    });
  });

  describe('Custom class behavior', () => {
    class CustomClass {
      constructor(public prop: string) {}
    }

    it('should show what Winston console transport actually prints with custom class (no defaultMeta)', () => {
      const logger = createLogger({
        level: 'info',
        format: format.json(),
        transports: [new winston.transports.Console()],
      });

      const customObject = new CustomClass('value');

      console.log('=== WINSTON CONSOLE OUTPUT (NO DEFAULTMETA) ===');
      logger.info('Custom class test', customObject);
      console.log('===============================================');
    });

    it('should show what Winston console transport actually prints with custom class (with defaultMeta)', () => {
      const logger = createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { userId: 123, appName: 'test' },
        transports: [new winston.transports.Console()],
      });

      const customObject = new CustomClass('value');

      console.log('=== WINSTON CONSOLE OUTPUT (WITH DEFAULTMETA) ===');
      logger.info('Custom class test', customObject);
      console.log('=================================================');
    });

    it('should show what Winston console transport prints with multiple custom classes', () => {
      const logger = createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const customObject1 = new CustomClass('value1');
      const customObject2 = new CustomClass('value2');

      console.log('=== WINSTON CONSOLE OUTPUT (MULTIPLE CUSTOM CLASSES) ===');
      logger.info('Multiple custom classes', customObject1, customObject2);
      console.log('========================================================');
    });

    it('should show what Winston console transport prints with custom class mixed with primitives', () => {
      const logger = createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const customObject = new CustomClass('value');

      console.log('=== WINSTON CONSOLE OUTPUT (CUSTOM CLASS + PRIMITIVES) ===');
      logger.info('Mixed types', customObject, 'extra-string', 42, { sessionId: 'abc' });
      console.log('==========================================================');
    });

    it('should verify Winston behavior with custom class as splat (with defaultMeta)', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const customObject = new CustomClass('value');
      logger.info('test message', customObject);
      const info = captureTransport.lastInfo;

      console.log('=== CUSTOM CLASS SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', customObject);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===========================');
    });

    it('should verify Winston behavior with custom class as only splat (no defaultMeta)', () => {
      const logger = createLogger({
        transports: [captureTransport],
      });

      const customObject = new CustomClass('value');
      logger.info('test message', customObject);
      const info = captureTransport.lastInfo;

      console.log('=== CUSTOM CLASS ONLY SPLAT ===');
      console.log('splat:', customObject);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('================================');
    });

    it('should verify Winston behavior with multiple custom classes as splat (same property name)', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const customObject1 = new CustomClass('value1');
      const customObject2 = new CustomClass('value2');
      logger.info('test message', customObject1, customObject2);
      const info = captureTransport.lastInfo;

      console.log('=== MULTIPLE CUSTOM CLASS SPLAT (SAME PROP) ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [customObject1, customObject2]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===============================================');
    });

    it('should verify Winston behavior with multiple custom classes as splat (different property names)', () => {
      class CustomClassA {
        constructor(public propA: string) {}
      }
      class CustomClassB {
        constructor(public propB: string) {}
      }

      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const customObjectA = new CustomClassA('valueA');
      const customObjectB = new CustomClassB('valueB');
      logger.info('test message', customObjectA, customObjectB);
      const info = captureTransport.lastInfo;

      console.log('=== MULTIPLE CUSTOM CLASS SPLAT (DIFFERENT PROPS) ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [customObjectA, customObjectB]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('====================================================');
    });

    it('should show what Winston console transport prints with custom classes (different property names)', () => {
      class CustomClassA {
        constructor(public propA: string) {}
      }
      class CustomClassB {
        constructor(public propB: string) {}
      }

      const logger = createLogger({
        level: 'info',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const customObjectA = new CustomClassA('valueA');
      const customObjectB = new CustomClassB('valueB');

      console.log('=== WINSTON CONSOLE OUTPUT (DIFFERENT PROPERTY NAMES) ===');
      logger.info('Multiple custom classes', customObjectA, customObjectB);
      console.log('=========================================================');
    });

    it('should verify Winston behavior with custom class mixed with other types', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const customObject = new CustomClass('value');
      logger.info('test message', customObject, 'extra-string', 42, { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== CUSTOM CLASS MIXED WITH OTHER TYPES ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [customObject, 'extra-string', 42, { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
    });
  });

  describe('Error in splat parameters behavior', () => {
    it('should show what Winston console transport prints with Error in splat + string', () => {
      const logger = createLogger({
        level: 'error',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const testError = new Error('Test error message');

      console.log('=== WINSTON CONSOLE OUTPUT (ERROR IN SPLAT + STRING) ===');
      logger.error('hello', testError, 'world');
      console.log('=======================================================');
    });

    it('should show what Winston console transport prints with Error in splat + object', () => {
      const logger = createLogger({
        level: 'error',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const testError = new Error('Test error message');

      console.log('=== WINSTON CONSOLE OUTPUT (ERROR IN SPLAT + OBJECT) ===');
      logger.error('hello', testError, { my: 'object' });
      console.log('========================================================');
    });

    it('should show what Winston console transport prints with object + Error (Error as 2nd splat)', () => {
      const logger = createLogger({
        level: 'error',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const testError = new Error('Test error message');

      console.log('=== WINSTON CONSOLE OUTPUT (OBJECT + ERROR AS 2ND SPLAT) ===');
      logger.error('hello', { my: 'object' }, testError);
      console.log('============================================================');
    });

    it('should show what Winston console transport prints with object + Error + more items', () => {
      const logger = createLogger({
        level: 'error',
        format: format.json(),
        defaultMeta: { userId: 123 },
        transports: [new winston.transports.Console()],
      });

      const testError = new Error('Test error message');

      console.log('=== WINSTON CONSOLE OUTPUT (OBJECT + ERROR + MORE) ===');
      logger.error('hello', { my: 'object' }, testError, { another: 'object' }, 'extra');
      console.log('======================================================');
    });

    it('should verify Winston behavior with object + Error as 2nd splat', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const testError = new Error('Test error message');
      logger.error('hello', { my: 'object' }, testError);
      const info = captureTransport.lastInfo;

      console.log('=== OBJECT + ERROR AS 2ND SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [{ my: 'object' }, testError]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===================================');
    });

    it('should verify Winston behavior with object + Error + more items', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const testError = new Error('Test error message');
      logger.error('hello', { my: 'object' }, testError, { another: 'object' }, 'extra');
      const info = captureTransport.lastInfo;

      console.log('=== OBJECT + ERROR + MORE ITEMS ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [{ my: 'object' }, testError, { another: 'object' }, 'extra']);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===================================');
    });

    it('should verify Winston behavior with Error as first parameter + primitives', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const testError = new Error('Test error message');
      (logger as any).error(testError, 'hello', 'world');
      const info = captureTransport.lastInfo;

      console.log('=== ERROR + PRIMITIVES SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('first param (Error):', testError);
      console.log('splat:', ['hello', 'world']);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('================================');
    });

    it('should verify Winston behavior with Error as first parameter + object', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });

      const testError = new Error('Test error message');
      (logger as any).error(testError, 'hello', { my: 'object' });
      const info = captureTransport.lastInfo;

      console.log('=== ERROR + OBJECT SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('first param (Error):', testError);
      console.log('splat:', ['hello', { my: 'object' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('=============================');
    });
  });

  // Primitive first splat parameter tests
  describe('Primitive first splat parameter behavior', () => {
    it('should handle number as first splat with object defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', 42, { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== NUMBER FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [42, { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===========================');
    });

    it('should handle string as first splat with object defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', 'hello', { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== STRING FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', ['hello', { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('===========================');
    });

    it('should handle boolean as first splat with object defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', true, { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== BOOLEAN FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [true, { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('============================');
    });

    it('should handle null as first splat with object defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', null, { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== NULL FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [null, { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('=========================');
    });

    it('should handle Date as first splat with object defaultMeta', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', testDate, { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== DATE FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [testDate, { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('=========================');
    });

    it('should handle array as first splat with object defaultMeta', () => {
      const logger = createLogger({
        defaultMeta: { userId: 123 },
        transports: [captureTransport],
      });
      logger.info('test', [1, 2, 3], { sessionId: 'abc' });
      const info = captureTransport.lastInfo;

      console.log('=== ARRAY FIRST SPLAT ===');
      console.log('defaultMeta:', { userId: 123 });
      console.log('splat:', [[1, 2, 3], { sessionId: 'abc' }]);
      console.log('Winston info:', JSON.stringify(info, null, 2));
      console.log('Info keys:', Object.keys(info));
      console.log('Splat symbol:', info[SPLAT]);
      console.log('==========================');
    });
  });
});
