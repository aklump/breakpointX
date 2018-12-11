<?php

namespace AKlump\BreakpointX;

/**
 * @coversDefaultClass BreakpointX;
 * @group              ${test_group}
 */
class BreakpointXTest extends \PHPUnit_Framework_TestCase {

  public function testAssertLowerAndUppersBreakpointsAreReturnedInSegments() {
    $obj = new BreakpointX([241, 769]);
    $this->assertSame(null, $obj->getSegment(0)['lowerBreakpoint']);
    $this->assertSame(241, $obj->getSegment(0)['upperBreakpoint']);
    $this->assertSame(241, $obj->getSegment(400)['lowerBreakpoint']);
    $this->assertSame(769, $obj->getSegment(400)['upperBreakpoint']);
    $this->assertSame(769, $obj->getSegment(800)['lowerBreakpoint']);
    $this->assertSame(null, $obj->getSegment(800)['upperBreakpoint']);
  }

  public function testAssertWeCanIterateObject() {
    $obj = new BreakpointX([768], ['alpha', 'bravo']);
    foreach ($obj as $segment_name => $segment) {
      $this->assertInternalType('array', $segment);
      $this->assertSame($segment_name, $segment['name']);
    }
  }

  public function testAssertDeviceAndRenameFirstSegment() {
    $obj = new BreakpointX();
    $segment = $obj
      ->addDevice('desktop', 768)
      ->renameSegment(0, 'mobile')
      ->getSegment('mobile');
    $this->assertSame('mobile', $segment['name']);
    $this->assertSame([768], $obj->breakpoints);
    $this->assertSame(['mobile', 'desktop'], $obj->segmentNames);
    $this->assertSame('mobile', $obj->getSegment(400)['name']);
  }

  public function testAssertGetSegmentMediaQueryWorks() {
    $obj = new BreakpointX([241, 769], ['tiny', 'mobile', 'desktop']);
    $this->assertSame($obj->getSegment('(min-width:769px)')['name'], 'desktop');
    $this->assertSame($obj->getSegment('(min-width: 769px)')['name'], 'desktop');
    $this->assertSame($obj->getSegment('( min-width: 769px )')['name'], 'desktop');
    $this->assertSame($obj->getSegment('(max-width:240px)')['name'], 'tiny');
    $this->assertSame($obj->getSegment('(max-width: 240px)')['name'], 'tiny');
    $this->assertSame($obj->getSegment('( max-width: 240px )')['name'], 'tiny');
    $this->assertSame($obj->getSegment('(min-width:241px) and (max-width:768px)')['name'], 'mobile');
    $this->assertSame($obj->getSegment('(min-width:241px)and(max-width:768px)')['name'], 'mobile');
    $this->assertSame($obj->getSegment(' (min-width:241px) and (max-width: 768px)')['name'], 'mobile');
  }

  public function testBreakpointsUsingStringWorks() {
    $obj = new BreakpointX(['768px']);
    $this->assertSame([768], $obj->breakpoints);
  }

  public function testGetSegmentWithBogusName() {
    $this->assertNull($this->obj->getSegment('bogus')['name']);
  }

  public function testGetSegmentUsingMediaQuery() {
    $segment = $this->obj->getSegment('(min-width:480px) and (max-width:767px)');
    $this->assertSame('480-767', $segment['name']);
    $segment = $this->obj->getSegment('(min-width:480px)and(max-width:767px)');
    $this->assertSame('480-767', $segment['name']);
    $segment = $this->obj->getSegment('(min-width: 480px) and (max-width: 767px)');
    $this->assertSame('480-767', $segment['name']);
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

  public function testAddDevice() {
    $obj = new BreakpointX();
    $obj
      ->addDevice('iphone-tall', 480)
      ->addDevice('ipad-tall', 768)
      ->addDevice('ipad-wide', 1024);

    $this->assertSame([480, 768, 1024], $obj->breakpoints);
    $this->assertSame([
      '0-479',
      'iphone-tall',
      'ipad-tall',
      'ipad-wide',
    ], $obj->segmentNames);
    $this->assertSame('0-479', $obj->getSegment(479)['name']);
    $this->assertSame('iphone-tall', $obj->getSegment(480)['name']);
    $this->assertSame('ipad-tall', $obj->getSegment(768)['name']);
    $this->assertSame('ipad-wide', $obj->getSegment(1024)['name']);
    $this->assertSame('ipad-wide', $obj->getSegment(1025)['name']);
  }

  public function testWeCanReadTheSettings() {
    $settings = $this->obj->settings();
    $this->assertArrayHasKey('breakpointRayImageWidthRatio', $settings);
  }

  public function testFirst() {
    $this->assertSame("0-479", $this->obj->getSegment(0)['name']);
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
    $this->assertSame('768-infinity', $segment['name']);
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
    $this->assertSame("768-infinity", $this->obj->getRay()['name']);
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
      '768-infinity',
    ], $this->obj->segmentNames);
  }

  public function setUp() {
    $this->obj = new BreakpointX([480, 768]);
  }
}
