<?php

/**
 * @file
 * Load a source file, replace tokens and save to dist folder.
 */

namespace AKlump\WebPackage;

$build
  ->load('src/BreakpointX.js')
  ->replace()
  ->saveToDist()
  ->minify('dist/BreakpointX.js')
  ->displayMessages();
