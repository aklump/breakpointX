<?php

/**
 * @file
 * Load a source file, replace tokens and save to dist folder.
 */

namespace AKlump\WebPackage;

$build
  ->loadFile('src/BreakpointX.js')
  ->replaceTokens()
  ->saveToDist()
  ->minifyFile('dist/BreakpointX.js')
  ->addFilesToScm(["dist"])
  ->displayMessages();
