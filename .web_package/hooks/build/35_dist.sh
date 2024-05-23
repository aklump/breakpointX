#!/usr/bin/env bash

[ ! -e dist/ ] || rm -r dist/ || exit 1
mkdir dist/ || exit 2
