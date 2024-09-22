#!/usr/bin/env bash

# Usage on Semaphore: bash ci/test.sh

set -e

echo "Testing with NodeJS $(node --version) / $(pnpm --version)"

pnpm install
pnpm run lint
pnpm test
