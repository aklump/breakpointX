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
var window = window || {};
var BreakpointX = (function(window) {

  /**
   * Stores data from the last callback fire.
   *
   * @type {{}}
   */
  var previousCallbackData = {};

  /**
   * Helper function to determine the media query by raw data.
   *
   * @param int lower_breakpoint The lower breakpoint value.
   * @param int upper_breakpoint The upper breakpoint value.
   * @returns {string}
   * @private
   */
  function getMediaQuery(min, max) {
    var type = max === Infinity ? 'ray' : 'segment';
    var queries = [];
    if (type === 'ray') {
      queries.push('min-width:' + min);
    } else {
      if (min === 0) {
        queries.push('max-width:' + max);
      } else {
        queries.push('min-width:' + min);
        queries.push('max-width:' + max);
      }
    }
    return '(' + queries.join('px) and (') + 'px)';
  }

  /**
   * Function callback for sorting breakpoints.
   * @param a
   * @param b
   * @returns {number}
   */
  function sortBreakpoints(a, b) {
    return a - b;
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
    removeClass.call(this, 'smaller');
    removeClass.call(this, 'bigger');
    removeClass.call(this, pSegment.name);
    addClass.call(this, segment.name);
    if (direction) {
      addClass.call(this, direction);
    }
  };

  function removeClass(unprefixedClassName) {
    var className = this.settings.classPrefix + unprefixedClassName;
    if (this.el.classList)
      this.el.classList.remove(className);
    else
      this.el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }

  function addClass(unprefixedClassName) {
    var className = this.settings.classPrefix + unprefixedClassName;
    if (this.el.classList)
      this.el.classList.add(className);
    else
      this.el.className += ' ' + className;
  }

  function extend(out) {
    out = out || {};

    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i])
        continue;

      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key))
          out[key] = arguments[i][key];
      }
    }

    return out;
  }

  /**
   * Determine if a value is a numeric point or not.
   *
   * @param mixed value
   *
   * @returns {boolean}
   *   True if value is a breakpoint and not a name or media query.
   */
  function valueIsPoint(value) {
    if (value === Infinity) return true;
    var intval = parseInt(value, 10);
    return intval >= 0 && intval == value;
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

    /**
     * Holds the element that will receive CSS classes, if set.
     */
    this.el = null;

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

    var settings = {},
      self = this;

    // Ensure breakpoints are sorted ascending; we will always assume the
    // segment names are in the correct sort, and never touch them.  Also we
    // clone the breakpoints array so as not to mutate by accident.
    if (breakpoints) {
      self.breakpoints = breakpoints.slice().map(function(item) {
        return parseInt(item, 10);
      }).sort(sortBreakpoints);
      if (self.breakpoints[0] === 0) {
        throw new Error('You must not include a breakpoint of 0.');
      }
    } else {
      self.breakpoints = [];
    }
    if (arguments.length === 3) {
      settings = extend({}, arguments[2]);
      self.segmentNames = arguments[1].slice();
    } else if (arguments.length === 2) {
      if (arguments[1] instanceof Array) {
        self.segmentNames = arguments[1].slice();
      } else {
        settings = extend({}, arguments[1]);
        self.segmentNames = [];
      }
    }
    if (self.segmentNames.length && self.segmentNames.length - 1 !== self.breakpoints.length) {
      throw new Error('You must have one more segment name than you have breakpoints; you need ' + (self.breakpoints.length + 1) + ' segment names.');
    }
    self.settings = extend({}, self.options, settings);
    self.reset();

    // Auto-name missing segment names.
    if (!self.segmentNames.length) {
      var last = 0;
      for (var i in self.breakpoints) {
        var breakpoint = self.breakpoints[i];
        self.segmentNames.push(last + '-' + (breakpoint - 1));
        last = breakpoint;
      }
      self.segmentNames.push(last + '-infinity');
    }

    // Register our own handler if we're to manipulate classes.
    if (self.settings.addClassesTo) {
      self.el = this.settings.addClassesTo;
      self
        .addCrossAction(actionApplyCss)
        .triggerActions();
    }

    var throttleTimeout = null;
    window.addEventListener('resize', function() {
      clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(function() {
        self.onWindowResize();
      }, self.settings.resizeThrottle);
    });

    return self;
  }

  /**
   * Default options definition.
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

  BreakpointX.prototype.renameSegment = function(pointInSegment, name) {
    var segment = this.getSegment(pointInSegment),
      i = this.segmentNames.indexOf(segment.name);
    this.segmentNames[i] = name;
    return this;
  };

  BreakpointX.prototype.addDevice = function(name, screenWidth) {
    this.breakpoints.push(screenWidth);
    this.breakpoints = this.breakpoints.sort(sortBreakpoints);
    if (this.segmentNames[0] === '0-infinity') {
      this.segmentNames[0] = '0-' + (screenWidth - 1);
    }
    var i = this.breakpoints.indexOf(screenWidth);
    this.segmentNames.splice(i + 1, 1, name);

    return this;
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
   * Get the final "segment" to the right of the highest breakpoint.
   *
   * @returns {{}}
   */
  BreakpointX.prototype.getRay = function() {
    var name = this.segmentNames[this.segmentNames.length - 1];
    return this.getSegment(name);
  };

  /**
   * Utility function to get a segment (or ray) by value, name or media query.
   *
   * Technically speaking the last "segment" is a ray, but for simplicity you
   * may use this function to return the ray as well.  You can also use
   * ::getRay() to get the last "segment".  Take notice of the 'type' key which
   * will be either 'ray' or 'segment'.
   *
   * To get the leftmost segment use ::getSegment(0).
   *
   * @param int|string data
   *   Can be point value, segment name or media query.
   * @returns {{}}
   *
   * @see ::getRay()
   */
  BreakpointX.prototype.getSegment = function(data) {
    var segmentName = null;
    if (valueIsPoint(data)) {
      for (var i in this.breakpoints) {
        var bp = this.breakpoints[i];
        if (bp > data) {
          segmentName = this.segmentNames[i];
          break;
        }
        segmentName = this.segmentNames[(i * 1 + 1)];
      }
    } else if (valueIsMediaQuery(data)) {
      var min = 0;
      var breakpoints = this.breakpoints.slice();
      breakpoints.push(Infinity);
      for (var i in breakpoints) {
        var bp = this.breakpoints[i];
        var max = bp ? bp - 1 : Infinity;
        var query = getMediaQuery(min, max);
        if (query.replace(/ /g, '') === data.replace(/ /g, '')) {
          segmentName = this.segmentNames[i];
          break;
        }
        min = bp;
      }
    } else {
      segmentName = data;
    }

    var segment = {
      '@media': null,
      from: null,
      imageWidth: null,
      name: null,
      to: null,
      type: null,
      width: null,
    };

    var i = this.segmentNames.indexOf(segmentName);
    if (segmentName && i >= 0) {
      var prevBp = this.breakpoints[i - 1] || null;
      var nextBp = this.breakpoints[i] || null;
      segment.type = nextBp ? 'segment' : 'ray';
      segment.from = prevBp || 0;
      segment.to = nextBp ? nextBp - 1 : Infinity;
      segment['@media'] = getMediaQuery(segment.from, segment.to);
      segment.imageWidth = segment.type === 'segment' ? segment.to : Math.round(segment.from * this.settings.breakpointRayImageWidthRatio);
      segment.name = segmentName;
      segment.width = segment.to;
    }

    return segment;
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
})(window);

if (typeof module === 'object' && module.exports) {
  module.exports = BreakpointX;
}
