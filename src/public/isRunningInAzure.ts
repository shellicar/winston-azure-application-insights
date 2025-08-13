import { env } from 'node:process';

export const isRunningInAzure = () => {
  return env.WEBSITE_INSTANCE_ID !== undefined;
};
