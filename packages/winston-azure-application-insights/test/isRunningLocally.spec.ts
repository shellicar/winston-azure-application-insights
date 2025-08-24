import { describe, expect, it } from 'vitest';
import { isRunningLocally } from '../src/public/isRunningLocally';
import { useEnvironmentVariable } from './helpers/useEnvironmentVariable';

describe('isRunningLocally', () => {
  const websiteInstanceId = useEnvironmentVariable('WEBSITE_INSTANCE_ID');

  it('should return true when not running in Azure', () => {
    websiteInstanceId.unset();

    expect(isRunningLocally()).toBe(true);
  });

  it('should return false when running in Azure', () => {
    websiteInstanceId.set('azure-instance');

    expect(isRunningLocally()).toBe(false);
  });
});
