#!/usr/bin/env bash

# Have to change into the directory of the config file is not found.
cd src && ../node_modules/.bin/prettier "*.js" --write
