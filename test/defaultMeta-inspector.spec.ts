import { describe, it } from 'vitest';
import { createLogger } from 'winston';
import TransportStream from 'winston-transport';
import { splatSymbol } from '../src/consts';
import type { WinstonInfo } from '../src/types';

class InspectorTransport extends TransportStream {
  override log(info: WinstonInfo, next: () => void) {
    console.log('=== RAW WINSTON INFO ===');
    console.log('Full info object:', JSON.stringify(info, null, 2));
    console.log('Info keys:', Object.keys(info));
    console.log('Info.message:', info.message);
    console.log('Info[splatSymbol]:', info[splatSymbol]);
    console.log('Info.defaultMeta:', (info as any).defaultMeta);
    console.log('========================');
    next();
  }
}

describe('defaultMeta Winston investigation', () => {
  it('should show what Winston does with string defaultMeta', () => {
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: 'my-app-v1.0.0',
      transports: [inspector],
    });

    logger.info('test message');
  });

  it('should show what Winston does with number defaultMeta', () => {
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: 3000,
      transports: [inspector],
    });

    logger.info('test message');
  });

  it('should show what Winston does with boolean defaultMeta', () => {
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: true,
      transports: [inspector],
    });

    logger.info('test message');
  });

  it('should show what Winston does with null defaultMeta', () => {
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: null,
      transports: [inspector],
    });

    logger.info('test message');
  });

  it('should show what Winston does with Date defaultMeta', () => {
    const testDate = new Date('2025-01-01T00:00:00.000Z');
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: testDate,
      transports: [inspector],
    });

    logger.info('test message');
  });

  it('should show what Winston does with object defaultMeta (our original test)', () => {
    const inspector = new InspectorTransport();
    const logger = createLogger({
      defaultMeta: { userId: 123, appVersion: '1.0.0' },
      transports: [inspector],
    });

    logger.info('test message');
  });
});
