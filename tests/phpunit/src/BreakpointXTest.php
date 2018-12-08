<?php

namespace AKlump\BreakpointX;

/**
 * @coversDefaultClass BreakpointX;
 * @group              ${test_group}
 */
class BreakpointXTest extends \PHPUnit_Framework_TestCase {

  public function testWeCanReadTheSettings() {
    $settings = $this->obj->settings();
    $this->assertArrayHasKey('breakpointRayImageWidthRatio', $settings);
  }

  public function testFirst() {
    $this->assertSame("0-479", $this->obj->getSegment(0)['name']);
  }

  public function testFirstSegmentIsCorrect() {
    $segment = $this->obj->getSegment(100);
    $this->assertSame('0-479', $segment['name']);
    $this->assertSame('segment', $segment['type']);
    $this->assertSame(0, $segment['from']);
    $this->assertSame(479, $segment['to']);
    $this->assertSame('(max-width:479px)', $segment['@media']);
    $this->assertSame(479, $segment['width']);
    $this->assertSame(479, $segment['imageWidth']);
  }

  public function testSecondSegmentIsCorrect() {
    $segment = $this->obj->getSegment(500);
    $this->assertSame('480-767', $segment['name']);
    $this->assertSame('segment', $segment['type']);
    $this->assertSame(480, $segment['from']);
    $this->assertSame(767, $segment['to']);
    $this->assertSame('(min-width:480px) and (max-width:767px)', $segment['@media']);
    $this->assertSame(767, $segment['width']);
    $this->assertSame(767, $segment['imageWidth']);
  }

  public function testThirdSegmentIsCorrect() {
    $segment = $this->obj->getSegment(800);
    $this->assertSame('768-Infinity', $segment['name']);
    $this->assertSame('ray', $segment['type']);
    $this->assertSame(768, $segment['from']);
    $this->assertSame(NULL, $segment['to']);
    $this->assertSame('(min-width:768px)', $segment['@media']);
    $this->assertSame(NULL, $segment['width']);
    $this->assertSame(1075, $segment['imageWidth']);
  }

  public function testQuery() {
    $obj = new BreakpointX([480, 768], ['small', 'mobile', 'desktop']);
    $this->assertSame('(max-width:479px)', $obj->getSegment('small')['@media']);
    $this->assertSame('(min-width:480px) and (max-width:767px)', $obj->getSegment('mobile')['@media']);
    $this->assertSame('(min-width:768px)', $obj->getSegment('desktop')['@media']);
  }

  public function testSortingOrderWorksCorrectly() {
    $obj = new BreakpointX(['1081', '769', '961'], [
      'desktop',
      'desktop--medium',
      'desktop--wide',
    ]);
    $this->assertSame(769, $obj->breakpoints[0]);
    $this->assertSame(961, $obj->breakpoints[1]);
    $this->assertSame(1081, $obj->breakpoints[2]);
    $this->assertSame('desktop', $obj->segmentNames[0]);
    $this->assertSame('desktop--medium', $obj->segmentNames[1]);
    $this->assertSame('desktop--wide', $obj->segmentNames[2]);
  }

  public function testLast() {
    $this->assertSame("768-Infinity", $this->obj->getBreakpointRay()['name']);
  }

  public function testConstructWithNamedAliases() {
    $this->obj = new BreakpointX([500], ['small', 'large']);
    $this->assertSame([500], $this->obj->breakpoints);
    $this->assertSame([
      'small',
      'large',
    ], $this->obj->segmentNames);
  }

  public function testConstruct() {
    $this->assertSame([480, 768], $this->obj->breakpoints);
    $this->assertSame([
      '0-479',
      '480-767',
      '768-Infinity',
    ], $this->obj->segmentNames);
  }

  public function setUp() {
    $this->obj = new BreakpointX([480, 768]);
  }
}
