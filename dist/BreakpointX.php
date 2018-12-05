<?php

namespace AKlump\BreakpointX;

/**
 * Class BreakpointX
 *
 * A server-side compliment to BreakpointX.js
 *
 * @version 0.4.14
 * @package AKlump\BreakpointX
 */
class BreakpointX {

  public $version = '0.4.14';

  public $aliases;

  public $breakpoints;

  protected $settings = [];

  /**
   * BreakpointX constructor.
   */
  public function __construct(array $breakpoints) {
    $this->init($breakpoints);
  }

  /**
   * Return the value of a settings.
   *
   * Most importantly, to get the breakpoint setting used to instantiate.
   *
   * @code
   *   $obj->getSetting('breakpoints');
   * @endcode
   *
   * @param mixed $default Optional, a default value other than null.
   *
   * @return array
   */
  public function getSetting($setting, $default = NULL) {
    return isset($this->settings[$setting]) ? $this->settings[$setting] : $default;
  }

  public function init($breakpoints) {
    asort($breakpoints);
    $this->settings['breakpoints'] = $breakpoints;

    //
    //
    // Convert numeric keys to media queries.
    //
    if (is_numeric(key($breakpoints))) {
      foreach (array_keys($breakpoints) as $i) {
        $next_bp_index = $i + 1;
        $query = $this->_query(
          $breakpoints[$i],
          (isset($breakpoints[$next_bp_index]) ? $breakpoints[$next_bp_index] : NULL)
        );
        $converted[$query] = $breakpoints[$i];
      }
      $breakpoints = $converted;
    }

    $this->aliases = [];
    $sortable = [];
    foreach (array_keys($breakpoints) as $alias) {
      $pixels = intval($breakpoints[$alias]);
      $sortable[] = [$alias, $pixels];
    }

    usort($sortable, function ($a, $b) {
      return $a[1] - $b[1];
    });
    foreach (array_keys($sortable) as $i) {
      $i *= 1;
      $minWidth = $sortable[$i][1];
      $alias = $sortable[$i][0];
      $this->aliases[] = $alias;
      $maxWidth = isset($sortable[$i + 1]) ? $sortable[$i + 1][1] - 1 : NULL;
      $this->breakpoints[$alias] = [$minWidth, $maxWidth];
    }
  }

  /**
   * Return the pixel value of a breakpoint alias.
   *
   * @param  {string} alias E.g. 'large'
   *
   * @return {array} [min, max]
   */
  public function value($alias) {
    return isset($this->breakpoints[$alias]) ? $this->breakpoints[$alias] : NULL;
  }

  /**
   * Return the media query string for an alias.
   *
   * @param string alias
   *   The alias name
   *
   * @return string
   *   The media query string, e.g. 'min-width: 769px'.
   */
  public function query($alias) {
    list($lower_breakpoint, $upper_breakpoint) = $this->value($alias);
    $upper_breakpoint = is_null($upper_breakpoint) ? NULL : ++$upper_breakpoint;

    return $this->_query($lower_breakpoint, $upper_breakpoint);
  }

  /**
   * Return the alias of a pixel width.
   *
   * Special width keys are:
   *   - 'first' Returns the alias of the smallest breakpoint.
   *   - 'last' Returns the alias of the widest breakpoint.
   *
   * Any pixel value within a viewport will yield the same alias, e.g.
   * 750, 760, 768 would all yield "tablet" if "tablet" was set up with 768
   * as the width.
   *
   * Be aware that a value larger than the highest defined breakpoint will
   * still return the hightest defined breakpoint alias.
   *
   * @return string
   */
  public function alias($width) {
    if ($width === 'first') {
      return reset($this->aliases);
    }
    if ($width === 'last') {
      return end($this->aliases);
    }

    $found = NULL;
    foreach (array_keys($this->breakpoints) as $alias) {
      $bp = $this->breakpoints[$alias][0];
      $found = $found ? $found : $alias;
      if ($width < $bp) {
        return $found;
      }
      $found = $alias;
    }

    return $found;
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
    !is_null($upper_breakpoint) && --$upper_breakpoint;
    if ($lower_breakpoint == 0) {
      return "max-width:{$upper_breakpoint}px";
    }
    elseif (is_null($upper_breakpoint)) {
      return "min-width:{$lower_breakpoint}px";
    }

    return "(min-width:{$lower_breakpoint}px) and (max-width:{$upper_breakpoint}px)";
  }
}
