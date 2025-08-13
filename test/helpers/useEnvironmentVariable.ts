import { afterEach, beforeEach } from 'vitest';

export const useEnvironmentVariable = (envVarName: string) => {
  let originalValue: string | undefined;

  beforeEach(() => {
    originalValue = process.env[envVarName];
  });

  afterEach(() => {
    if (originalValue !== undefined) {
      process.env[envVarName] = originalValue;
    } else {
      delete process.env[envVarName];
    }
  });

  return {
    set: (value: string) => {
      process.env[envVarName] = value;
    },
    unset: () => {
      delete process.env[envVarName];
    },
  };
};
