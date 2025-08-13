import { beforeEach } from 'vitest';
import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';
import { extractErrorsStep } from '../../src/extractErrorsStep';
import { isError } from '../../src/isError';
import type { TelemetryDataException } from '../../src/types';

export class SpyErrorTransport extends TransportStream {
  public exceptions: TelemetryDataException[] = [];

  constructor() {
    super();
    beforeEach(() => {
      this.exceptions = [];
    });
  }

  override log(info: WinstonInfo, next: () => void) {
    this.exceptions = extractErrorsStep(info, isError);
    next();
  }
}
