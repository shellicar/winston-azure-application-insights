import TransportStream from 'winston-transport';
import type { WinstonInfo } from '../../src';
import { extractMessageStep } from '../../src/extractMessageStep';
import { extractPropertiesStep } from '../../src/extractPropertiesStep';
import { isError } from '../../src/isError';

export class SpyPropertiesTransport extends TransportStream {
  public properties: Record<string, unknown> | unknown[] = {};
  override log(info: WinstonInfo, next: () => void) {
    const extractedInfo = extractMessageStep(info);
    this.properties = extractPropertiesStep(extractedInfo, isError);
    next();
  }
}
