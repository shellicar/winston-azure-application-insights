import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';
import { extractPropertiesStep } from '../../src/private/extractPropertiesStep';
import { isError } from '../../src/private/isError';

export class SpyPropertiesTransport extends TransportStream {
  public properties: Record<string, unknown> | unknown[] = {};
  override log(info: WinstonInfo, next: () => void) {
    this.properties = extractPropertiesStep(info, isError);
    next();
  }
}
