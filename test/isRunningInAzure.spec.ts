import { describe, expect, it } from 'vitest';
import { isRunningInAzure } from '../src/public/isRunningInAzure';
import { useEnvironmentVariable } from './helpers/useEnvironmentVariable';

describe('isRunningInAzure', () => {
  const websiteInstanceId = useEnvironmentVariable('WEBSITE_INSTANCE_ID');

  it('should return true when WEBSITE_INSTANCE_ID is set', () => {
    websiteInstanceId.set('some-instance-id');

    expect(isRunningInAzure()).toBe(true);
  });

  it('should return false when WEBSITE_INSTANCE_ID is not set', () => {
    websiteInstanceId.unset();

    expect(isRunningInAzure()).toBe(false);
  });

  it('should return true when WEBSITE_INSTANCE_ID is empty string', () => {
    websiteInstanceId.set('');

    expect(isRunningInAzure()).toBe(true);
  });
});
