#!/usr/bin/env bash
yarn || hook_exception
composer update || hook_exception
