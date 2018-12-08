/**
 * __title jQuery Plugin v__version
 * __url
 *
 * __description
 *
 * Copyright 2015__year, __author
 *
 * @license Dual licensed under the MIT or GPL Version 3 licenses.
 *
 * Date: __date_string
 */
/**
 *
 * Access the current segment using this.getSegmentByWindow()
 *
 * @code
 *   var bp = new BreakpointX([240, 768], ['small', 'medium', 'large']);
 *   bp
 *   .addBreakpointCrossActionDecreasingOnly(768, function () {
 *     console.log("Now you're in medium!");
 *   })
 *   .addBreakpointCrossActionDecreasingOnly(240, function () {
 *     console.log("Now you're in small!");
 *   })
 *   .addBreakpointCrossActionIncreasingOnly(768, function () {
 *     console.log("Now you're in large!");
 *   })
 *   .addCrossAction(function(segment, direction, breakpoint, previousSegment) {
 *     ...
 *   });
 *
 * @endcode
 *
 * @code
 *   var bp = new BreakpointX([240, 768]);
 *   bp.getSegment(240).name === '240-767';
 *   bp.getSegment(240)['@media'] === '(min-width:240px) and (max-width:
 *   767px)'; bp.addAction('smaller', ['240-767'], function (from, to,
 *   direction) { console.log('Now you\'re in 240-767!');
 *   })
 * @endcode
 */
var BreakpointX = (function($, window) {

  /**
   * Stores data from the last callback fire.
   *
   * @type {{}}
   */
  var previousCallbackData = {};

  /**
   * Stores the segment information.
   *
   * Use ::getSegment for public access.
   *
   * @type {{}}
   */
  var segmentData = {};

  /**
   * Helper function to determine the media query by raw data.
   *
   * @param int lower_breakpoint The lower breakpoint value.
   * @param int upper_breakpoint The upper breakpoint value.
   * @returns {string}
   * @private
   */
  function getMediaQuery(leftBreakpointValue, breakpointValue) {
    var type = breakpointValue === Infinity ? 'ray' : 'segment';
    var queries = [];
    if (type === 'ray') {
      queries.push('min-width:' + leftBreakpointValue);
    } else {
      if (leftBreakpointValue === 0) {
        queries.push('max-width:' + (breakpointValue - 1));
      } else {
        queries.push('min-width:' + leftBreakpointValue);
        queries.push('max-width:' + (breakpointValue - 1));
      }
    }
    return '(' + queries.join('px) and (') + 'px)';
  }

  /**
   * Apply the appropriate CSS to the DOM.
   *
   * @param object from
   *   A segment definition object.
   * @param object to
   *   A segment definition object.
   * @param string direction
   *   The direction of change. One of:
   *   - bigger
   *   - smaller
   *   - both
   */
  function actionApplyCss(segment, direction, breakpoint, pSegment) {
    var $el = $(this.settings.addClassesTo),
      p = this.settings.classPrefix;
    $el
      .removeClass(p + 'smaller')
      .removeClass(p + 'bigger')
      .removeClass(p + pSegment.name)
      .addClass(p + segment.name);
    if (direction) {
      $el.addClass(p + direction);
    }
  };

  /**
   * Determine if a value is a numeric point or not.
   *
   * @param mixed value
   *
   * @returns {boolean}
   *   True if value is a breakpoint and not a name or media query.
   */
  function valueIsPoint(value) {
    return value === Infinity || parseInt(value, 10) == value;
  }

  function valueIsMediaQuery(value) {
    return typeof value === 'string' && value.indexOf('-width:') >= 0;
  }

  /**
   * Helper function to add an action.
   */
  function addActionByDirectionAndBreakpoint(direction, breakpoint, callable) {
    var segment = this.getSegment(breakpoint);
    if (valueIsPoint(breakpoint)) {
      if (breakpoint !== segment.from) {
        throw new Error('You tried to add an action to an unregistered breakpoint "' + breakpoint + '"; you must use one of: ' + this.breakpoints.join(', '));
      }
    } else {
      throw new Error('The provided breakpoint "' + breakpoint + '" is not recognized.');
    }
    this.actions[direction][breakpoint] = this.actions[direction][breakpoint] || [];
    this.actions[direction][breakpoint].push(callable);

    return this;
  }

  /**
   * Return a new instance of BreakpointX
   *
   * @param array breakpoints
   * @param ...
   *   -  array An optional array of segment names.
   *   -  object An optional last argument, which should be a settings object
   *   if not using default options.
   *
   * @constructor
   */
  function BreakpointX(breakpoints) {

    this.version = '__version';

    /**
     * A public array of segment names in ascending from/to values.
     *
     * @type {Array}
     */
    this.segmentNames = [];

    /**
     * A public sorted array of breakpoints
     *
     * @type {Array}
     *   Each value is the point on the axis of the breakpoint.
     */
    this.breakpoints = [];

    if (breakpoints.length < 1) {
      throw new Error('You must include at least one breakpoint; you\'ve included none.');
    }
    var settings = {},
      self = this;

    // Ensure breakpoints are sorted ascending; we will always assume the
    // segment names are in the correct sort, and never touch them.  Also we
    // clone the breakpoints array so as not to mutate by accident.
    self.breakpoints = breakpoints.slice().sort(function(a, b) {
      return a - b;
    });
    if (self.breakpoints[0] === 0) {
      throw new Error('You must not include a breakpoint of 0.');
    }
    if (arguments.length === 3) {
      settings = $.extend({}, arguments[2]);
      self.segmentNames = arguments[1].slice();
    } else if (arguments.length === 2) {
      if (arguments[1] instanceof Array) {
        self.segmentNames = arguments[1].slice();
      } else {
        self.segmentNames = [];
        settings = $.extend({}, self.segmentNames);
      }
    }
    if (self.segmentNames.length && self.segmentNames.length - 1 !== self.breakpoints.length) {
      throw new Error('You must have one more segment name than you have breakpoints; you need ' + (self.breakpoints.length + 1) + ' segment names.');
    }
    self.settings = $.extend({}, self.options, settings);
    self.reset();

    // Auto-name missing segment names.
    if (!self.segmentNames.length) {
      var last = 0;
      for (var i in self.breakpoints) {
        var breakpoint = self.breakpoints[i];
        self.segmentNames.push(last + '-' + (breakpoint - 1));
        last = breakpoint;
      }
      self.segmentNames.push(last + '-Infinity');
    }

    // Make sure that breakpoint values are integers in pixels and listed in
    // ascending order; calculate the maxWidth values.
    var leftBreakpointValue = 0;
    segmentData = {};
    for (var i in self.segmentNames) {
      var segmentName = self.segmentNames[i],
        breakpointValue = self.breakpoints[i] || Infinity,
        type = 'ray';
      if (breakpointValue !== Infinity) {
        type = 'segment';
        breakpointValue = parseInt(breakpointValue, 10);
      }
      segmentData[segmentName] = {
        name: segmentName,
        type: type,
        from: leftBreakpointValue,
        to: breakpointValue === Infinity ? Infinity : breakpointValue - 1,
        width: breakpointValue === Infinity ? Infinity : breakpointValue - 1,
        '@media': getMediaQuery(leftBreakpointValue, breakpointValue),

        // Images for this segment should have this width.
        imageWidth: type === 'segment' ? breakpointValue - 1 : parseInt(leftBreakpointValue * self.settings.breakpointRayImageWidthRatio, 10),
      };
      leftBreakpointValue = breakpointValue;
    }

    // Register our own handler if we're to manipulate classes.
    if (self.settings.addClassesTo) {
      self
        .addCrossAction(actionApplyCss)
        .triggerActions();
    }

    var throttleTimeout = null;
    $(window).resize(function() {
      clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(function() {
        self.onWindowResize();
      }, self.settings.resizeThrottle);
    });

    return self;
  }

  /**
   * Default options definition.
   *
   * Extend globally like this:
   * @code
   *   $.extend(BreakpointX.prototype.options, {
   *     key: 'overridden'
   *   });
   * @endcode
   */
  BreakpointX.prototype.options = {

    /**
     * Optional, a jquery selector or object where classes will be added.
     *
     * @type {String|jQuery}
     */
    addClassesTo: null,

    /**
     * A prefix to be added to all css classes.
     *
     * @type {String}
     */
    classPrefix: 'bpx-',

    /**
     * This number will slow down the firing of the of the resize callbacks,
     * the higher the number, the longer the delay when the window resize
     * changes, but the less resource intensive.
     *
     * @type {int}
     */
    resizeThrottle: 250,

    /**
     * A number greater or equal 1 used to compute the width of the images used
     * by the breakpoint ray.  Presumably less than 2.
     *
     * @type {float}
     */
    breakpointRayImageWidthRatio: 1.4,
  };

  /**
   * Handler for a window resize event.
   *
   * This can be called directly to simulate user actions, e.g. when testing.
   *
   * @param int width
   *   Optional.  Omit to use the current window width.
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.onWindowResize = function(width) {
    var self = this,
      activeWindowWidth = valueIsPoint(width) ? width : this.getWindowWidth(),
      segment = self.getSegment(activeWindowWidth),
      pSegment = previousCallbackData.segment,
      hasCrossedBreakpoint = pSegment.name && segment.name !== pSegment.name,
      callbacks = false,
      breakpoint = null;

    if (!pSegment.name) {
      // This is the first run, when we have no previous info, thus not cross.
      var activeWindowSegment = self.getSegment(activeWindowWidth);
      for (var d in self.actions) {
        if (!self.actions[d].length) {
          continue;
        }
        for (var bp in self.actions[d]) {
          var from = self.getSegment(bp).from,
            addSmaller = activeWindowSegment.to + 1 === from,
            addBigger = from === activeWindowSegment.from,
            applyCallbacks = (d === 'smaller' && addSmaller)
              || (d === 'bigger' && addBigger)
              || (d === 'both' && (addSmaller || addBigger));
          if (applyCallbacks) {
            callbacks = callbacks || [];
            callbacks['bp' + activeWindowSegment.from] = self.actions[d][bp];
          }
        }
      }
    } else if (hasCrossedBreakpoint) {
      callbacks = callbacks || [];
      var direction = activeWindowWidth > pSegment.from ? 'bigger' : 'smaller';
      breakpoint = direction === 'smaller' ? pSegment.from : segment.from;
      var low = Math.min(pSegment.from, segment.from);
      var high = Math.max(pSegment.from, segment.from);
      var directions = ['both', direction];
      for (var i in directions) {
        for (var j in self.breakpoints) {
          var bp = self.breakpoints[j];
          if (low <= bp && bp <= high && self.actions[directions[i]][bp]) {
            callbacks['bp' + bp] = self.actions[directions[i]][bp];
          }
        }
      }
    }

    if (callbacks) {
      for (var bp in callbacks) {
        for (var i in callbacks[bp]) {
          callbacks[bp][i].call(self, segment, direction, breakpoint, pSegment);
        }
      }
    }

    if (callbacks || !previousCallbackData.segment.name) {
      previousCallbackData = {
        breakpoint: breakpoint,
        direction: direction,
        segment: segment,
      };
    }

    return this;
  };

  /**
   * Trigger action callbacks to fire immediately.
   *
   * This differs from onWindowResize, in that this function will always fire
   * events, whereas onWindowResize, will take into account
   * previousCallbackData, and will thus sometimes not fire actions.  This
   * method can be called after adding actions if you wish to initialize them
   * and not wait for a resize event.
   *
   * An example is that if you want an event to fire on page load, you would
   * need to chain this method on to the add* method:
   *
   * @code
   *   var bpx = new BreakpointX([500]);
   *   bpx
   *   .addCrossAction(function(){
   *      // Do something immediately.
   *   })
   *   .triggerActions();
   * @endcode
   *
   * @param int width
   *   The width used to decide which actions will be triggered.  This is
   *   optional.  Omit to use the current window width.
   *
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.triggerActions = function(width) {
    previousCallbackData.segment = this.getSegment(null);
    return this.onWindowResize(width);
  };

  /**
   * Return the width of the current window.
   *
   * This method is faster than using jQuery.
   * @returns {int}
   */
  BreakpointX.prototype.getWindowWidth = function() {
    var width, e = window, a = 'inner';
    if (!('innerWidth' in window)) {
      a = 'client';
      e = document.documentElement || document.body;
    }
    width = e[a + 'Width'];
    return width;
  };

  /**
   * Clears all callbacks
   *
   * @return {BreakpointX}
   */
  BreakpointX.prototype.reset = function() {
    this.actions = {
      'bigger': [],
      'smaller': [],
      'both': []
    };
    previousCallbackData = {
      segment: this.getSegment(null),
      direction: null
    };

    return this;
  };

  /**
   * Get the segment (ray) to the right of the highest breakpoint.
   *
   * @returns {{}}
   */
  BreakpointX.prototype.getBreakpointRay = function() {
    var name = this.segmentNames[this.segmentNames.length - 1];
    return this.getSegment(name);
  };


  /**
   * Utility function to get a segment from value, name or media query.
   *
   * @param int|string data
   *   Can be point value, segment name or media query.
   * @returns {{}}
   */
  BreakpointX.prototype.getSegment = function(data) {
    if (valueIsPoint(data)) {
      var point = data === Infinity ? Infinity : parseInt(data, 10);
      data = null;
      for (var name in segmentData) {
        var segment = segmentData[name];
        if (segment.from <= point && point <= segment.to) {
          data = name;
          break;
        } else if (segment.to === Infinity && point >= segment.from) {
          data = name;
          break;
        }
      }
    } else if (valueIsMediaQuery(data)) {
      for (var name in segmentData) {
        var segment = segmentData[name];
        if (segment && segment['@media'].replace(/ /g, '') === data.replace(/ /g, '')) {
          // Clone the object we return so it can't be manipulated externally.
          return $.extend({}, segment);
        }
      }
    }
    return segmentData[data] || {
      name: null,
      from: null,
      to: null,
      '@media': null,
    };
  };

  /**
   * Current the segment represented by the current window width.
   *
   * @returns {{}|undefined}
   */
  BreakpointX.prototype.getSegmentByWindow = function() {
    var width = this.getWindowWidth();
    return this.getSegment(width);
  };


  /**
   * Add a callback anytime, any breakpoint is crossed, in any direction.
   *
   * @param callable
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.addCrossAction = function(callable) {
    for (var i in this.breakpoints) {
      this.actions['both'][this.breakpoints[i]] = this.actions['both'][this.breakpoints[i]] || [];
      this.actions['both'][this.breakpoints[i]].push(callable);
    }
    return this;
  };

  /**
   * Add callback for single breakpoint is crossed in either direction.
   *
   * @param int breakpoint
   *   The breakpoint value.
   * @param callable
   *   A function to call
   *
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.addBreakpointCrossAction = function(breakpoint, callable) {
    return addActionByDirectionAndBreakpoint.call(this, 'both', breakpoint, callable);
  };

  /**
   * Add callback for a single breakpoint crossing when getting smaller.
   *
   * @param int breakpoint
   *   The breakpoint value.
   * @param callable
   *   A function to call
   *
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.addBreakpointCrossActionDecreasingOnly = function(breakpoint, callable) {
    return addActionByDirectionAndBreakpoint.call(this, 'smaller', breakpoint, callable);
  };

  /**
   * Add callback for a single breakpoint crossing when getting bigger.
   *
   * @param int breakpoint
   *   The breakpoint value.
   * @param callable
   *   A function to call
   *
   * @returns {BreakpointX}
   */
  BreakpointX.prototype.addBreakpointCrossActionIncreasingOnly = function(breakpoint, callable) {
    return addActionByDirectionAndBreakpoint.call(this, 'bigger', breakpoint, callable);
  };

  return BreakpointX;
})(jQuery, window);

if (typeof module === 'object' && module.exports) {
  module.exports = BreakpointX;
}
