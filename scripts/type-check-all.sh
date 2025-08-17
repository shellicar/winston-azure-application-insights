#!/bin/bash
set -e

echo "Running type-check across all packages..."

for dir in $(find . -name package.json -not -path '*/node_modules/*' -exec dirname {} \;); do
  if [ -f "$dir/package.json" ]; then
    cd "$dir"
    # Check if type-check script exists
    if npm run type-check --silent 2>/dev/null; then
      echo "✓ Type-check passed in $dir"
    else
      echo "✗ Type-check failed in $dir"
      exit 1
    fi
    cd - > /dev/null
  fi
done

echo "All type-checks passed!"
