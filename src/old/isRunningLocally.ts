import { isRunningInAzure } from './isRunningInAzure';

export const isRunningLocally = () => {
  return !isRunningInAzure();
};
