<?php

namespace AKlump\BreakpointX;

/**
 * Class BreakpointX
 *
 * A server-side compliment to BreakpointX.js
 *
 * @version __version
 * @package AKlump\BreakpointX
 */
class BreakpointX {

  public $version = '__version';

  public $segmentNames;

  public $breakpoints;

  protected $segmentData;

  protected $settings = [
    'breakpointRayImageWidthRatio' => 1.4,
  ];

  /**
   * BreakpointX constructor.
   *
   * @param array $breakpoints
   *   An array of integers defining the breakpoints.
   * @param ....
   *   - $segmentNames An array of strings naming segments around the breakpoints
   *   - $settings An array of additional settings to merge in.
   *     - breakpointRayImageWidthRatio
   */
  public function __construct(array $breakpoints) {
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
    $this->settings = $settings + $this->settings;
    $this->breakpoints = array_map('intval', $breakpoints);
    sort($this->breakpoints);

    // Convert numeric keys to media queries.
    $last = 0;
    if (empty($this->segmentNames)) {
      foreach ($this->breakpoints as $breakpoint) {
        $this->segmentNames[] = "$last-" . ($breakpoint - 1);
        $last = $breakpoint;
      }
      $this->segmentNames[] = "$last-Infinity";
    }

    $this->segmentData = [];
    $last = 0;
    foreach ($this->segmentNames as $i => $segment_name) {
      $this->segmentData[$segment_name] = [
        'name' => $segment_name,
        'type' => ($type = empty($this->breakpoints[$i]) ? 'ray' : 'segment'),
        'from' => $last,
        'to' => ($to = $type === 'segment' ? $this->breakpoints[$i] - 1 : NULL),
        '@media' => $this->_query($last, $to),
        'width' => $to,
        'imageWidth' => $type === 'segment' ? $to : intval($last * $this->settings['breakpointRayImageWidthRatio']),
      ];
      $last = $type === 'segment' ? $this->breakpoints[$i] : NULL;
    }
  }

  public function getSegment($data) {
    if ($this->valueIsPoint($data)) {
      foreach ($this->segmentData as $segment) {
        if ($segment['from'] <= $data && $data <= $segment['to']) {
          $data = $segment['name'];
          break;
        }
        elseif ($segment['to'] === NULL && $data >= $segment['from']) {
          $data = $segment['name'];
          break;
        }
      }
    }
    elseif ($this->valueIsMediaQuery($data)) {
      $segments = array_filter($this->segmentData, function ($item) use ($data) {
        return $data === $item['@media'];
      });
      if (count($segments)) {
        $data = $segments[0]['name'];
      }
    }

    if (isset($this->segmentData[$data])) {
      return $this->segmentData[$data];
    }

    return [
      'name' => NULL,
      'from' => NULL,
      'to' => NULL,
      '@media' => NULL,
    ];
  }

  /**
   * Get the last segment (ray) after the highest breakpoint.
   *
   * @return array
   *   The segment to the right of the highest breakpoint.
   */
  public function getBreakpointRay() {
    return end($this->segmentData);
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
  protected function _query($lower_breakpoint, $upper_breakpoint = NULL) {
    if ($lower_breakpoint == 0) {
      return "(max-width:{$upper_breakpoint}px)";
    }
    elseif (is_null($upper_breakpoint)) {
      return "(min-width:{$lower_breakpoint}px)";
    }

    return "(min-width:{$lower_breakpoint}px) and (max-width:{$upper_breakpoint}px)";
  }
}
