<?php

namespace AKlump\BreakpointX;

/**
 * Class BreakpointX
 *
 * A server-side compliment to BreakpointX.js
 *
 * @package AKlump\BreakpointX
 */
class BreakpointX {

  public $aliases, $breakpoints;

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
    $this->settings['breakpoints'] = $breakpoints;

    //
    //
    // Convert numeric keys to media queries.
    //
    if (is_numeric(key($breakpoints))) {
      foreach (array_keys($breakpoints) as $i) {
        $next = $i + 1;
        $value = $breakpoints[$i];
        $isLast = TRUE;
        if (isset($breakpoints[$next])) {
          $isLast = FALSE;
          $value = $breakpoints[$next] - 1;
        }
        $query = $this->_query($value, $isLast);
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
    $isLast = $alias === $this->alias('last');
    $value = $this->value($alias);
    $value = $isLast ? $value[0] : $value[1];

    return $this->_query($value, $isLast);
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
   * @param array $value
   *   The array should contain [min, max].
   * @param bool $isLast
   *
   * @return string
   */
  protected function _query($value, $isLast = FALSE) {
    $declaration = $isLast ? 'min' : 'max';

    return "{$declaration}-width: {$value}px";
  }
}
