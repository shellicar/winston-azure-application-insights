import { inspect } from 'node:util';
import { beforeEach } from 'vitest';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';

/**
 * Spy Winston Transport for testing raw Winston behavior
 */
export class SpyWinstonTransport extends TransportStream {
  public capturedWinstonInfo: WinstonInfo[] = [];

  constructor() {
    super();
    beforeEach(() => {
      this.clear();
    });
  }

  override log(info: WinstonInfo, next: () => void) {
    console.log('SpyWinstonTransport log called with info:', inspect(info, { depth: null, colors: true }));
    this.capturedWinstonInfo.push(info);
    next();
  }

  get lastInfo() {
    return this.capturedWinstonInfo[this.capturedWinstonInfo.length - 1];
  }

  clear() {
    this.capturedWinstonInfo = [];
  }
}
