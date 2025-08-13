import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';
import { extractPropertiesStep } from '../../src/extractPropertiesStep';
import { isError } from '../../src/isError';

export class SpyPropertiesTransport extends TransportStream {
  public properties: Record<string, unknown> | unknown[] = {};
  override log(info: WinstonInfo, next: () => void) {
    this.properties = extractPropertiesStep(info, isError);
    next();
  }
}
