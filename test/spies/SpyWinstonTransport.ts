import { inspect } from 'node:util';
import { beforeEach } from 'vitest';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src/private/types';

/**
 * Spy Winston Transport for testing raw Winston behaviour
 */
export class SpyWinstonTransport extends TransportStream {
  public capturedWinstonInfo: WinstonInfo[] = [];

  constructor() {
    super();
    this.setMaxListeners(50);
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
