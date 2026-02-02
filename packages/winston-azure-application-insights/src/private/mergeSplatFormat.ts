import type { Format } from 'logform';
import { SPLAT } from 'triple-beam';
import winston from 'winston';
import { isPlainObject } from '../private/isPlainObject';

/**
 * Internal Winston format that merges all plain objects from SPLAT into the log info.
 * Used by createWinstonFormat when mergeSplat option is enabled.
 *
 * Only plain objects are merged - arrays, class instances, primitives, null, and undefined are ignored.
 * When multiple plain objects are present, they are merged left-to-right (last wins on collision).
 *
 * @internal
 */
export const mergeSplatFormat = (): Format => {
  return winston.format((info) => {
    const splat = info[SPLAT] as unknown[] | undefined;
    if (splat == null) {
      return info;
    }

    const plainObjects = splat.filter((item) => isPlainObject(item));
    if (plainObjects.length === 0) {
      return info;
    }

    return { ...info, ...Object.assign({}, ...plainObjects) };
  })();
};
