#!/bin/bash
#
# @file
# Copy distribution files to /dist
#
# YOU MUST USE 00_clean_slate.sh before this
#

test -h "$7/dist" && rm "$7/dist"
test -d "$7/dist" || mkdir -p "$7/dist"

# ... and files.
test -e "$7/README.md" && cp "$7/README.md" "$7/dist/"
test -e "$7/CHANGELOG.md" && cp "$7/CHANGELOG.md" "$7/dist/"
cp "$7/composer.json" "$7/dist/"
cp "$7/BreakpointX.js" "$7/dist/"
cp "$7/BreakpointX.php" "$7/dist/"
cp "$7/version.yml" "$7/dist/"

cd "$7" && git add .
