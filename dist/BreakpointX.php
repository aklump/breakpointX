<?php
// SPDX-License-Identifier: BSD-3-Clause

namespace AKlump\BreakpointX;

use OutOfBoundsException;

/**
 * Class BreakpointX
 *
 * A server-side compliment to BreakpointX.js
 *
 * @version 0.9.3
 * @package AKlump\BreakpointX
 */
class BreakpointX implements \Iterator {


  public $version = '0.9.3';

  /**
   * An indexed array of segment names.
   *
   * There is always one more than the number of breakpoints.
   *
   * @var array
   */
  public $segmentNames;

  /**
   * An indexed array of breakpoint values.
   *
   * @var array
   */
  public $breakpoints;

  /**
   * Holds the current settings being used.
   *
   * @var array|mixed
   */
  protected $_settings = [];

  /**
   * Internal interation key.
   *
   * @var int
   */
  protected $iteration = 0;

  /**
   * Hold the default options for settings.
   *
   * @var array
   */
  protected $options = [
    'breakpointRayImageWidthRatio' => 1.4,
  ];

  /**
   * An array of aliases keyed by segment names.
   *
   * @var array
   */
  protected $aliases = [];

  /**
   * BreakpointX constructor.
   *
   * @param array $breakpoints
   *   An array of integers defining the breakpoints.
   * @param ....
   *   - $segmentNames An array of strings naming segments around the
   *   breakpoints
   *   - $settings An array of additional settings to merge in.
   *     - breakpointRayImageWidthRatio
   *
   * @throws \OutOfBoundsException If an invalid breakpoint value is received.
   */
  public function __construct(array $breakpoints = []) {
    $args = func_get_args();
    $settings = [];
    if (func_num_args() === 3) {
      $settings = array_pop($args);
      $this->segmentNames = array_pop($args);
    }
    elseif (func_num_args() === 2) {
      $last = array_pop($args);
      if (is_numeric(key($last))) {
        $this->segmentNames = $last;
      }
      else {
        $settings = $last;
      }
    }
    $this->_settings = $settings + $this->options;
    $breakpoints = array_map('intval', $breakpoints);
    if (in_array(0, $breakpoints)) {
      throw new OutOfBoundsException('Breakpoint "0" is invalid; breakpoints must be > 0.');
    }
    $this->breakpoints = $breakpoints;
    sort($this->breakpoints);

    // Convert numeric keys to media queries.
    $last = 0;
    if (empty($this->segmentNames)) {
      foreach ($this->breakpoints as $breakpoint) {
        $this->segmentNames[] = "$last-" . ($breakpoint - 1);
        $last = $breakpoint;
      }
      $this->segmentNames[] = "$last-infinity";
    }
  }

  /**
   * Public accessor for the current settings (read-only).
   *
   * To write settings you must pass an array as the last argument of the
   * constructor.
   *
   * @return array
   * @see ::options For the default values and valid keys.
   *
   */
  public function settings() {
    return $this->_settings;
  }

  /**
   * Create an alias to a segment.
   *
   * You may create as many alias to a segment as you want.  You can then use
   * the alias as you would a segment name.
   *
   * @param $point_in_segment
   * @param $alias
   *
   * @return $this
   */
  public function aliasSegment($point_in_segment, $alias) {
    $this->aliases[$alias] = $this->getSegment($point_in_segment)['name'];

    return $this;
  }

  public function renameSegment($point_in_segment, $name) {
    $i = array_search($this->getSegment($point_in_segment)['name'], $this->segmentNames);
    $this->segmentNames[$i] = $name;

    return $this;
  }

  public function getSegment($data) {
    $segment_name = $data;
    if ($this->valueIsPoint($data)) {
      $data = intval($data);
      foreach ($this->breakpoints as $i => $bp) {
        if ($bp > $data) {
          $segment_name = $this->segmentNames[$i];
          break;
        }
        $segment_name = $this->segmentNames[$i + 1];
      }
    }
    elseif ($this->valueIsMediaQuery($data)) {
      $min = NULL;
      $breakpoints = $this->breakpoints;
      $breakpoints[] = NULL;
      foreach ($breakpoints as $i => $bp) {
        $max = $bp ? $bp - 1 : $bp;
        $query = $this->_query($min, $max);
        if (str_replace(' ', '', $query) === str_replace(' ', '', $data)) {
          $segment_name = $this->segmentNames[$i];
          break;
        }
        $min = $bp;
      }
    }
    $segment = array_fill_keys([
      '@media',
      'media',
      'mediaMin',
      'mediaMax',
      'from',
      'imageWidth',
      'name',
      'to',
      'type',
      'width',
      'lowerBreakpoint',
      'upperBreakpoint',
    ], NULL);

    $i = array_search($segment_name, $this->segmentNames);
    if ($segment_name && $i === FALSE && isset($this->aliases[$segment_name])) {
      $segment_name = $this->aliases[$segment_name];
      $i = array_search($segment_name, $this->segmentNames);
    }
    if ($segment_name && $i !== FALSE) {
      $prev_bp = empty($this->breakpoints[$i - 1]) ? NULL : $this->breakpoints[$i - 1];
      $next_bp = empty($this->breakpoints[$i]) ? NULL : $this->breakpoints[$i];
      $segment['type'] = empty($next_bp) ? 'ray' : 'segment';
      $segment['from'] = $prev_bp ?: 0;
      $segment['to'] = $next_bp ? $next_bp - 1 : NULL;
      $segment['lowerBreakpoint'] = $prev_bp ?: NULL;
      $segment['upperBreakpoint'] = $next_bp;
      $segment['@media'] = $this->_query($segment['from'], $segment['to']);
      $segment['media'] = $segment['@media'];
      list($a, $b) = explode(' and ', $segment['@media'] . ' and ');
      if (empty($segment['lowerBreakpoint'])) {
        $segment['mediaMin'] = '';
        $segment['mediaMax'] = $a;
      }
      else {
        $segment['mediaMin'] = $a;
        $segment['mediaMax'] = $b ?: '';
      }

      $segment['imageWidth'] = $segment['type'] === 'segment' ? $segment['to'] : intval($segment['from'] * $this->_settings['breakpointRayImageWidthRatio']);
      $segment['name'] = $segment_name;
      $segment['width'] = $segment['to'];
    }

    return $segment;
  }

  /**
   * Get the last segment (ray) after the highest breakpoint.
   *
   * @return array
   *   The segment to the right of the highest breakpoint.
   */
  public function getRay() {
    return $this->getSegment(end($this->segmentNames));
  }

  protected function valueIsPoint($value) {
    return is_numeric($value);
  }

  protected function valueIsMediaQuery($value) {
    return strstr($value, '-width:');
  }

  /**
   * Helper function to determine the media query by raw data.
   *
   * @param array $lower_breakpoint
   *   The x of the smaller breakpoint.
   * @param array $upper_breakpoint
   *   The x value of the higher breakpoint or null if there is none.
   *
   * @return string
   */
  protected function _query($min, $max = NULL) {
    if ($min == 0) {
      return "(max-width:{$max}px)";
    }
    elseif (is_null($max)) {
      return "(min-width:{$min}px)";
    }

    return "(min-width:{$min}px) and (max-width:{$max}px)";
  }

  /**
   * Create a breakpoint and segment name based on a target device.
   *
   * @param string $name
   *   The device name, this becomes the segment name to the right of the
   *   breakpoint created by the device width.
   * @param int $screen_width
   *   The width of the device; this becomes a breakpoint.
   *
   * @return \AKlump\BreakpointX\BreakpointX
   */
  public function addDevice($name, $screen_width) {
    $this->breakpoints[] = $screen_width;
    sort($this->breakpoints);
    if ($this->segmentNames[0] === '0-infinity') {
      $this->segmentNames[0] = '0-' . ($screen_width - 1);
    }
    $i = array_search($screen_width, $this->breakpoints);
    array_splice($this->segmentNames, $i + 1, 1, $name);

    return $this;
  }

  /**
   * Add a breakpoint based on a screen width.
   *
   * @param int $screen_width
   *   The width of the screen.
   *
   * @return $this
   */
  public function addByScreenWidth($screen_width) {
    $breakpoint = $screen_width + 1;
    $this->breakpoints[] = $breakpoint;
    sort($this->breakpoints);
    if ($this->segmentNames[0] === '0-infinity') {
      $this->segmentNames[0] = 'min_0';
    }
    $i = array_search($breakpoint, $this->breakpoints);
    array_splice($this->segmentNames, $i + 1, 1, 'min_' . $breakpoint);

    return $this;
  }

  #[\ReturnTypeWillChange]
  public function current() {
    return $this->getSegment($this->segmentNames[$this->iteration]);
  }

  #[\ReturnTypeWillChange]
  public function next() {
    ++$this->iteration;
  }

  #[\ReturnTypeWillChange]
  public function key() {
    return $this->segmentNames[$this->iteration];
  }

  #[\ReturnTypeWillChange]
  public function valid() {
    return isset($this->segmentNames[$this->iteration]);
  }

  #[\ReturnTypeWillChange]
  public function rewind() {
    $this->iteration = 0;
  }

}
