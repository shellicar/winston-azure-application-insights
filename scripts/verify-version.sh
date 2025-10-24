#!/bin/sh
set -e

SCRIPT_DIR=`dirname "$0"`
. "$SCRIPT_DIR/verify-version-functions.sh"

main() {
    local package_name=$(get_package_name) || exit $?
    local full_version=$(get_full_version "$package_name") || exit $?  
    local changelog=$(get_changelog) || exit $?
    local base_version=$(get_base_version "$full_version")

    check_version_header "$changelog" "$base_version" "$full_version"
    check_version_links "$changelog" "$package_name"
}

main
