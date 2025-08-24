import { beforeEach } from 'vitest';
import TransportStream from 'winston-transport';
import { extractErrorsStep } from '../../src/private/extractErrorsStep';
import { isError } from '../../src/private/isError';
import type { WinstonInfo } from '../../src/private/types';
import type { TelemetryDataException } from '../../src/public/types';

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
