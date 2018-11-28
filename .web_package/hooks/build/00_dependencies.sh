#!/usr/bin/env bash
cd "$7" && yarn || exit 1
cd "$7" && composer update || exit 1
