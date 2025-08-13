import { SPLAT } from 'triple-beam';
import type { WinstonInfo } from '../src';

/**
 * Creates a WinstonInfo object that matches Winston's behavior when logging a string message with Error in splat.
 * Based on winston-behavior-verification.spec.ts findings:
 * - message gets concatenated with Error message
 * - Error goes into SPLAT
 */
export function createWinstonInfo(info: WinstonInfo, error: Error): WinstonInfo {
  if (info[SPLAT] == null) {
    info[SPLAT] = [];
  }
  info[SPLAT].unshift(error);

  info.message = `${info.message} ${error.message}`;

  return info;
}
