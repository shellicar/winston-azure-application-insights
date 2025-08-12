import { beforeEach } from 'vitest';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';
import { extractErrorsStep } from '../../src/extractErrorsStep';
import { isError } from '../../src/isError';

export class SpyErrorTransport extends TransportStream {
  public errors: Error[] = [];

  constructor() {
    super();
    beforeEach(() => {
      this.errors = [];
    });
  }

  override log(info: WinstonInfo, next: () => void) {
    this.errors = extractErrorsStep(info, isError);
    next();
  }
}
