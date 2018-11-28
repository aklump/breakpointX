#!/usr/bin/env bash

source "${11}/functions.sh"

$7/node_modules/.bin/uglifyjs --compress --mangle --output=dist/BreakpointX.min.js --comments -- BreakpointX.js

# Verify the minified assets were built.
wp_wait_for_exists "$7/dist/BreakpointX.min.js"
