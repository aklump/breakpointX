<?php

namespace AKlump\BreakpointX;

/**
 * @coversDefaultClass BreakpointX;
 * @group              ${test_group}
 */
class BreakpointXTest extends \PHPUnit_Framework_TestCase {

  public function testSortingOrderWorksCorrectly() {
    $setting = [
      "desktop--wide" => '1081',
      "desktop" => '769',
      "desktop--medium" => '961',
    ];
    $obj = new BreakpointX($setting);
    $this->assertSame(769, $obj->breakpoints['desktop'][0]);
    $this->assertSame(960, $obj->breakpoints['desktop'][1]);
    $this->assertSame(961, $obj->breakpoints['desktop--medium'][0]);
    $this->assertSame(1080, $obj->breakpoints['desktop--medium'][1]);
    $this->assertSame(1081, $obj->breakpoints['desktop--wide'][0]);
    $this->assertSame(null, $obj->breakpoints['desktop--wide'][1]);
  }

  public function testQuery() {
    $setting = array(
      "small" => 0,
      "mobile" => 480,
      "desktop" => 768,
    );
    $obj = new BreakpointX($setting);
    $this->assertSame('max-width: 479px', $obj->query('small'));
    $this->assertSame('max-width: 767px', $obj->query('mobile'));
    $this->assertSame('min-width: 768px', $obj->query('desktop'));
  }

  public function testGop() {
    $setting = array(
      "mobile" => 0,
      "desktop" => 768,
    );
    $obj = new BreakpointX($setting);
    $this->assertSame($setting, $obj->getSetting('breakpoints'));
    $this->assertSame(array_keys($setting), $obj->aliases);
  }

  public function testGetSettings() {
    $control = [0, 480, 768];
    $this->assertSame($control, $this->obj->getSetting('breakpoints'));
    $this->assertNull($this->obj->getSetting('lunch'));
    $this->assertSame(1, $this->obj->getSetting('index', 1));
  }

  public function testFirst() {
    $this->assertSame("max-width: 479px", $this->obj->alias('first'));
  }

  public function testLast() {
    $this->assertSame("min-width: 768px", $this->obj->alias('last'));
  }

  /**
   * Provides data for testValue.
   */
  function DataForTestValueProvider() {
    $tests = array();
    $tests[] = array([0, 479], "max-width: 479px", [100, 320]);
    $tests[] = array([480, 767], "max-width: 767px", [500, 600]);
    $tests[] = array([768, NULL], "min-width: 768px", [800, 2560]);

    return $tests;
  }

  /**
   * @dataProvider DataForTestValueProvider
   */
  public function testAlias($extremes, $alias, $other) {
    $subjects = array_filter(array_merge($extremes, $other));
    foreach ($subjects as $x) {
      $this->assertSame($alias, $this->obj->alias($x));
    }
  }

  /**
   * @dataProvider DataForTestValueProvider
   */
  public function testValue($control, $alias) {
    $this->assertSame($control, $this->obj->value($alias));
  }

  public function testConstruct() {
    $control = [
      "max-width: 479px" => [0, 479],
      "max-width: 767px" => [480, 767],
      "min-width: 768px" => [768, NULL],
    ];
    $this->assertSame($control, $this->obj->breakpoints);
    $this->assertSame(array_keys($control), $this->obj->aliases);
  }

  public function setUp() {
    $this->obj = new BreakpointX([0, 480, 768]);
  }
}
