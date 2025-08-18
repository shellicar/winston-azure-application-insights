#!/bin/sh

. ./get-npm-tag.sh

# Test cases
test_version() {
  VERSION="$1"
  EXPECTED="$2"
  printf "Testing %-20s -> " "$VERSION"
  
  if TAG=$(get_npm_tag "$VERSION" 2>&1); then
    if [ "$TAG" = "$EXPECTED" ]; then
      echo "✔️ OK: $TAG"
    else
      echo "❌ FAIL: got '$TAG', expected '$EXPECTED'"
    fi
  else
    if [ "$EXPECTED" = "ERROR" ]; then
      echo "✔️ OK: $TAG"
    else
      echo "❌ FAIL: got error '$TAG', expected '$EXPECTED'"
    fi
  fi
}

test_version "1.2.3" "latest"
test_version "1.2.3-" "ERROR"
test_version "1.2.3-hello" "ERROR"
test_version "1.2.3-hello.1" "hello"
test_version "1.2.3-hello.world" "ERROR"
test_version "1.2.3.4" "ERROR"
test_version "1.2.3-.1" "ERROR"
test_version "1.2.3-.world" "ERROR"
test_version "1.2.3-preview.1" "preview"
test_version "1.2.3-beta.2" "beta"
test_version "6.0.0preview.1" "ERROR"
test_version "1.2.3-hello-world.1" "hello-world"
test_version "1.2.3-hello.world.1" "hello.world"
test_version "1.2.3-v5-preview.1" "v5-preview"
test_version "1.2.3-v5.preview.1" "v5.preview"
test_version "6.0.1-v6.x.1" "ERROR"
test_version "1.2.3-hello-world.1" "hello-world"
test_version "1.2.3-hello.world.1" "hello.world"
test_version "1.2.3-123.1" "ERROR"
test_version "1.2.3-v1.1" "ERROR"
test_version "1.2.3-beta-rc.1" "beta-rc"
test_version "1.2.3-beta.rc.1" "beta.rc"
test_version "1.2.3-UPPERCASE.1" "UPPERCASE"
test_version "1.2.3-tag.0" "tag"
test_version "1.2.3-tag.999" "tag"
test_version "1.2.3-tag.1.extra" "ERROR"
test_version "1.2.3-tag." "ERROR"
test_version "1.2.3--tag.1" "ERROR"
test_version "1.2.3-tag.x.1" "tag.x"
test_version "1.2.3-1.2.x.1" "ERROR"
