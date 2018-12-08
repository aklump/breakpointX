<?php

/**
 * @file
 * Run the automated tests.
 */

namespace AKlump\WebPackage;

$build
  ->caution("You should manually run tests/qunit/test.html; as they are not yet automated.")
  ->runTests('phpunit.xml')
  ->displayMessages();
