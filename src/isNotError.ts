import { isError } from './isError';

export const isNotError = (item: unknown): boolean => !isError(item);
