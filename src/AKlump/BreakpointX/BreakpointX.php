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
    public function __construct(array $breakpoints)
    {
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
    public function getSetting($setting, $default = null)
    {
        return isset($this->settings[$setting]) ? $this->settings[$setting] : $default;
    }

    public function init($breakpoints)
    {
        $this->settings['breakpoints'] = $breakpoints;
        foreach (array_keys($breakpoints) as $i) {
            $next = $i + 1;
            if (isset($breakpoints[$next])) {
                $directive = 'max';
                $value = $breakpoints[$next] - 1;
            }
            else {
                $directive = 'min';
                $value = $breakpoints[$i];
            }
            $px = $value === 0 ? '' : 'px';
            $converted["({$directive}-width: {$value}{$px})"] = $breakpoints[$i];
        }
        $breakpoints = $converted;

        $this->aliases = [];
        $sortable = [];
        foreach (array_keys($breakpoints) as $alias) {
            $pixels = intval($breakpoints[$alias]);
            $sortable[] = [$alias, $pixels];
        }
        uasort($sortable, function ($a, $b) {
            return $a[1] - $b[1];
        });
        foreach (array_keys($sortable) as $i) {
            $i *= 1;
            $minWidth = $sortable[$i][1];
            $alias = $sortable[$i][0];
            $this->aliases[] = $alias;
            $maxWidth = isset($sortable[$i + 1]) ? $sortable[$i + 1][1] - 1 : null;
            $this->breakpoints[$alias] = [$minWidth, $maxWidth];
        }
    }

    public function value($alias)
    {
        return isset($this->breakpoints[$alias]) ? $this->breakpoints[$alias] : null;
    }

    public function alias($width)
    {
        if ($width === 'first') {
            return reset($this->aliases);
        }
        if ($width === 'last') {
            return end($this->aliases);
        }

        $found = null;
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
}
