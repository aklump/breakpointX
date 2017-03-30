<?php

namespace AKlump\BreakpointX;

/**
 * @coversDefaultClass BreakpointX;
 * @group              ${test_group}
 */
class BreakpointXTest extends \PHPUnit_Framework_TestCase {

    public function testGop()
    {
        $setting = array(
            "mobile"  => 0,
            "desktop"  => 768,
        );
        $obj = new BreakpointX($setting);
        $this->assertSame($setting, $obj->getSetting('breakpoints'));
        $this->assertSame(array_keys($setting), $obj->aliases);
    }

    public function testGetSettings()
    {
        $control = [0, 480, 768];
        $this->assertSame($control, $this->obj->getSetting('breakpoints'));
        $this->assertNull($this->obj->getSetting('lunch'));
        $this->assertSame(1, $this->obj->getSetting('index', 1));
    }

    public function testFirst()
    {
        $this->assertSame("(max-width: 479px)", $this->obj->alias('first'));
    }

    public function testLast()
    {
        $this->assertSame("(min-width: 768px)", $this->obj->alias('last'));
    }

    /**
     * Provides data for testValue.
     */
    function DataForTestValueProvider()
    {
        $tests = array();
        $tests[] = array([0, 479], "(max-width: 479px)", [100, 320]);
        $tests[] = array([480, 767], "(max-width: 767px)", [500, 600]);
        $tests[] = array([768, null], "(min-width: 768px)", [800, 2560]);

        return $tests;
    }

    /**
     * @dataProvider DataForTestValueProvider
     */
    public function testAlias($extremes, $alias, $other)
    {
        $subjects = array_filter(array_merge($extremes, $other));
        foreach ($subjects as $x) {
            $this->assertSame($alias, $this->obj->alias($x));
        }
    }

    /**
     * @dataProvider DataForTestValueProvider
     */
    public function testValue($control, $alias)
    {
        $this->assertSame($control, $this->obj->value($alias));
    }

    public function testConstruct()
    {
        $control = [
            "(max-width: 479px)" => [0, 479],
            "(max-width: 767px)" => [480, 767],
            "(min-width: 768px)" => [768, null],
        ];
        $this->assertSame($control, $this->obj->breakpoints);
        $this->assertSame(array_keys($control), $this->obj->aliases);
    }

    public function setUp()
    {
        $this->obj = new BreakpointX([0, 480, 768]);
    }
}
