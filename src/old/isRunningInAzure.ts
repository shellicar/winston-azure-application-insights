export const isRunningInAzure = () => {
  return process.env.WEBSITE_INSTANCE_ID !== undefined;
};
