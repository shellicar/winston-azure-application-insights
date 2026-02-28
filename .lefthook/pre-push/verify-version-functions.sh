#!/bin/sh

# Read package name from .packagename file
get_package_name() {
  cat .packagename
}

# Extract version field from package.json staged version
get_full_version() {
  local package_name="$1"
  git show :packages/$package_name/package.json | node -p "JSON.parse(require('fs').readFileSync(0)).version"
}

# Read CHANGELOG.md content from staged version
get_changelog() {
  git show :CHANGELOG.md
}

# Extract base version (x.y.z) from full version (x.y.z-preview.n)
get_base_version() {
  local full_version="$1"
  echo "$full_version" | sed 's/^\([0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/'
}

# Extract all version numbers from changelog headers in semver order (highest first)
get_changelog_versions() {
  local changelog="$1"
  local document_versions=$(echo "$changelog" | grep -o "^## \[[0-9]\+\.[0-9]\+\.[0-9]\+\]" | sed 's/## \[\(.*\)\]/\1/')
  local sorted_versions=$(echo "$document_versions" | sort -V -r)

  if [ "$document_versions" != "$sorted_versions" ]; then
    return 1
  fi

  echo "$document_versions"
  return 0
}

# Verify version header exists with proper date format (## [x.y.z] - YYYY-MM-DD)
check_version_header() {
  local changelog="$1"
  local base_version="$2"
  local full_version="$3"

  # Get first version from changelog
  local first_version=$(echo "$changelog" | grep -o "^## \[[0-9]\+\.[0-9]\+\.[0-9]\+\]" | sed 's/## \[\(.*\)\]/\1/' | head -n 1)

  # Check if package version matches first changelog entry
  if [ "$base_version" != "$first_version" ]; then
    echo "Error: Package version [$base_version] is not the first changelog entry (first entry: [$first_version])" >&2
    return 1
  fi

  echo "$changelog" | egrep -q "^## \[$base_version\] - [0-9]{4}-[0-9]{2}-[0-9]{2}\$"
  if [ $? -ne 0 ]; then
    echo "Error: Version header [$base_version] not found in CHANGELOG.md (package version: $full_version)" >&2
    return 1
  fi
}

# Verify all version headers have corresponding GitHub release tag link definitions
check_version_links() {
  local changelog="$1"
  local package_name="$2"
  local versions=$(get_changelog_versions "$changelog")

  local link_versions=$(echo "$changelog" | grep -o "^\[[0-9]\+\.[0-9]\+\.[0-9]\+\]:" | sed 's/^\[\(.*\)\]:/\1/')

  if [ "$versions" != "$link_versions" ]; then
    echo "Error: Version links are not in the same order as changelog headers" >&2
    return 1
  fi

  for v in $versions; do
    echo "$changelog" | egrep -q "^\[$v\]: https://github.com/shellicar/$package_name/releases/tag/$v\$"
    if [ $? -ne 0 ]; then
      echo "Error: Missing or invalid link definition for version [$v]" >&2
      return 1
    fi
  done
}
