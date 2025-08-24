import type { BaseWinstonInfo, WinstonInfo } from '../src/private/types';

/**
 * Creates a WinstonInfo object that matches Winston's behaviour when logging an Error as the only parameter.
 * Based on winston-behaviour-verification.spec.ts findings:
 * - info becomes an Error instance
 * - message is extracted as string
 */

export function createWinstonInfoFromErrorOnly(error: Error, info: BaseWinstonInfo = { level: 'error' }): WinstonInfo {
  return Object.assign<Error, BaseWinstonInfo>(error, info);
}
