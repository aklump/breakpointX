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
 * Each breakpoint setting consists of a minimum width (and an alias; the alias
 * will be created for you if you pass an array rather than an object to
 * init()). Each viewport is the span of the breakpoint minimum width to one
 * pixel less than the next-larger breakpoint's minimum width.  The largest
 * breakpoint has no maximum width. The first breakpoint should most always be
 * 0.
 *
 * Access the current segment using this.getSegmentByWindow()
 *
 * @code
 *   var bp = new BreakpointX([240, 768], ['small', 'medium', 'large']);
 *   bp
 *   .addAction('smaller', ['large'], function () {
 *     console.log('Now you\'re in medium!');
 *   })
 *   .addAction('smaller', ['small'], function () {
 *     console.log('Now you\'re in small!');
 *   })
 *   .addAction('bigger', ['large'], function () {
 *     console.log('Now you\'re in large!');
 *   })
 *   .addAction('both', ['large', 'small'], function(from, to, direction) {
 *     var bp = to.breakpoint;
 *     var message "You moved from "+ from.type +" " + from.name;
 *     console.log('Moved from segment '++' across breakpoint '++' to '+
 *   to.type +' ' + to.name);
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
    return value === Infinity || parseInt(value, 10);
  }

  function valueIsMediaQuery(value) {
    return typeof value === 'string' && value.indexOf('-width:') >= 0;
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
    if (breakpoints.length < 1) {
      throw new Error('You must include at least one breakpoint; you\'ve included none.');
    }
    var segmentNames = [];
    var settings = {};
    breakpoints = breakpoints.slice().sort(function(a, b) {
      return a - b;
    });
    if (breakpoints[0] === 0) {
      throw new Error('You must not include a breakpoint of 0.');
    }
    // breakpoints = breakpoints ? breakpoints.slice().sort() : [];
    breakpointSettings = breakpoints;
    if (arguments.length === 3) {
      settings = $.extend({}, arguments[2]);
      segmentNames = arguments[1].slice();
    } else if (arguments.length === 2) {
      segmentNames = arguments[1];
      if (!segmentNames instanceof Array) {
        segmentNames = [];
        settings = $.extend({}, segmentNames);
      }
    }
    if (segmentNames.length) {
      if (segmentNames.length - 1 !== breakpoints.length) {
        throw new Error('You must have one more segment name than you have breakpoints; you need ' + (breakpoints.length + 1) + ' segment names.');
      }
      var breakpointSettings = {};
      for (var i in segmentNames) {
        breakpointSettings[segmentNames[i]] = breakpoints[i] || Infinity;
      }
    }

    this.version = '__version';
    this.settings = $.extend({}, this.options, settings);

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

    segmentData = {};

    this.reset();
    init.call(this, breakpointSettings);
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
    resizeThrottle: 200,

    /**
     * A number greater or equal 1 used to compute the width of the images used
     * by the breakpoint ray.  Presumably less than 2.
     *
     * @type {float}
     */
    breakpointRayImageWidthRatio: 1.4
  };

  /**
   * Register the allowed breakpoints.
   *
   * @param  {object} breakpoints
   *   Each object element is comprised of an alias and a pixel value, where
   *   the pixel value is the width where the breakpoint begins.  Any value less
   *   than the lowest value indicated in this object, will be considered a part
   *   of the lowest breakpoint.
   *
   * @return {this}
   *
   * Given this code...
   * @code
   *   var bp = new BreakpointX([241, 769], ['small', 'medium', 'large']);
   *   bp.getSegment(240).name === 'small';
   *   bp.getSegment(320).name === 'medium';
   *   bp.getSegment(321).name === 'medium';
   *   bp.getSegment(768).name === 'medium';
   *   bp.getSegment(769).name === 'large';

   * @endcode
   *
   * ... the following will be true:
   *
   */
  function init(breakpointSettings) {
    var self = this;

    // Convert numeric keys to media queries.
    var converted = {};
    if (breakpointSettings instanceof Array) {
      breakpointSettings.unshift(0);
      if (breakpointSettings[breakpointSettings.length - 1] !== Infinity) {
        breakpointSettings.push(Infinity);
      }
      var next;
      for (var i in breakpointSettings) {
        next = i * 1 + 1;
        var autoname = [
          breakpointSettings[i],
          (breakpointSettings[next] - 1) || Infinity
        ].join('-');
        if (breakpointSettings[next]) {
          converted[autoname] = breakpointSettings[next];
        }
      }
      breakpointSettings = converted;
    }
    if (typeof breakpointSettings !== 'object') {
      throw ('The breakpoint settings must be either an array of breakpoint values, or an object with segment names and breakpoint values.');
    }

    // Make sure that breakpoint values are integers in pixels and listed in
    // ascending order; calculate the maxWidth values.
    var sortable = [];
    for (var name in breakpointSettings) {
      var breakpointValue = breakpointSettings[name];
      if (breakpointValue !== Infinity) {
        breakpointValue = parseInt(breakpointValue, 10);
      }
      sortable.push([name, breakpointValue]);
    }
    sortable.sort(function(a, b) {
      return a[1] - b[1];
    });
    var leftBreakpointValue = 0;
    for (i in sortable) {
      i *= 1;
      var segmentName = sortable[i][0],
        breakpointValue = sortable[i][1],
        type = breakpointValue === Infinity ? 'ray' : 'segment';
      segmentData[segmentName] = {
        name: segmentName,
        type: type,
        from: leftBreakpointValue,
        to: breakpointValue === Infinity ? Infinity : breakpointValue - 1,
        pixelWidth: breakpointValue === Infinity ? Infinity : breakpointValue - 1,
        '@media': getMediaQuery(leftBreakpointValue, breakpointValue),

        // Images for this segment should have this width.
        imageWidth: type === 'segment' ? breakpointValue - 1 : parseInt(leftBreakpointValue * self.settings.breakpointRayImageWidthRatio, 10),
      };
      self.segmentNames.push(segmentName);
      breakpointValue !== Infinity && self.breakpoints.push(breakpointValue);
      leftBreakpointValue = breakpointValue;
    }
    self.reset();

    // Register our own handler if we're to manipulate classes.
    if (this.settings.addClassesTo) {
      for (var i in this.breakpoints) {
        self.addWidthCrossesBreakpointAction(this.breakpoints[i], actionApplyCss);
      }
    }

    respondToWindowWidth.call(this);
    var throttleTimeout = null;
    $(window).resize(function() {
      clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(function() {
        respondToWindowWidth.call(this);
      }, self.settings.resizeThrottle);
    });

    return self;
  };

  /**
   * Trigger all actions based on a width or the current window.
   *
   * @param int width
   *   Optional.  Omit to use the current window width.
   * @returns {*}
   */
  BreakpointX.prototype.triggerActions = function(width) {
    previousCallbackData.segment = this.getSegment(null);
    return respondToWindowWidth.call(this, width);
  };

  function respondToWindowWidth(width) {
    var self = this,
      pointValue = width || this.getWindowWidth(),
      segment = self.getSegment(pointValue),
      pSegment = previousCallbackData.segment,
      crossed = segment.name !== pSegment.name,
      callbacks = [];
    if (crossed || !pSegment.name) {
      var callbacks = {},
        direction = null,
        breakpoint = null;
      if (pSegment.name) {
        direction = crossed ? (pointValue > pSegment.from ? 'bigger' : 'smaller') : null;
      }
      if (direction) {
        callbacks.push(self.actions[direction]);
        breakpoint = direction === 'smaller' ? pSegment.from : segment.from;
      }

      if (!breakpoint) {
        // This is the first run, when we have no previous info, thus not cross.
        var currentWindowSegment = this.getSegmentByWindow();
        for (var d in this.actions) {
          if (!this.actions[d].length) {
            continue;
          }
          for (var bp in this.actions[d]) {
            var breakpoint = this.getSegment(bp).from,
              addToCallbacks = false,
              addSmaller = currentWindowSegment.to + 1 === breakpoint,
              addBigger = breakpoint === currentWindowSegment.from;

            switch (d) {
              case 'smaller':
                addToCallbacks = addSmaller;
                break;
              case 'bigger':
                addToCallbacks = addBigger;
                break;
              case 'both':
                addToCallbacks = addSmaller || addBigger;
                break;
            }

            if (addToCallbacks) {
              callbacks[d] = callbacks[d] || [];
              callbacks[d][breakpoint] = this.actions[d][bp];
            }
          }
        }
      }
      // Fire off all callbacks.
      for (var d in callbacks) {
        for (var bp in callbacks[d]) {
          for (var i in callbacks[d][bp]) {
            callbacks[d][bp][i].call(self, segment, direction, breakpoint, pSegment);
          }
        }
      }


      previousCallbackData = {
        breakpoint: breakpoint,
        direction: direction,
        segment: segment,
      };
    }

    return this;
  };

  /**
   * Return the width of the current window.
   *
   * This method is faster than using jQuery.
   * @returns {*}
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
   * @return {this}
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
      var point = parseInt(data, 10);
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

  BreakpointX.prototype.addWidthCrossesBreakpointAction = function(breakpoint, callable) {
    var segment = this.getSegment(breakpoint);
    var direction = 'both';
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
  };

  BreakpointX.prototype.addWidthBecomesLessThanAction = function(breakpoint, callable) {
    var segment = this.getSegment(breakpoint),
      point = segment.from;

    console.log(segment);
  };
  BreakpointX.prototype.addWidthBecomesGreaterThanAction = function(breakpoint, callable) {
    var segment = this.getSegment(breakpoint),
      point = segment.from;

    console.log(segment);
  };

  /**
   * Register a callback to be executed when the window crosses one or more
   * breakpoints getting smaller, larger or in both directions.
   *
   * @param {string} direction
   *   One of: smaller, larger, both
   * @param {array} segmentNames
   *   E.g. [medium, large]
   * @param {Function} callback
   *   A callback to be executed.  Callbacks receive:
   *   - 0 The object moving from: {minWidth, maxWidth, name}
   *   - 1 The object moving to...
   *   - 2 The direction string.
   *   - The current BreakpointX object is available as this
   */
  BreakpointX.prototype.addAction = function(direction) {
    var self = this,
      breakpoints = this.breakpoints,
      callback;
    if (arguments.length === 2) {
      callback = arguments[1];
    } else if (arguments.length === 3) {
      breakpoints = arguments[1];
      callback = arguments[2];
    }
    if (typeof self.actions[direction] === undefined) {
      throw ('The direction you provided is not understood: ' + direction);
    } else if (breakpoints.length === 0) {
      throw ('You must provide at least one breakpoint in an array as the second argument.');
    } else if (typeof callback !== 'function') {
      throw ('The provided value for the callback is not a function.');
    } else {
      for (var i in breakpoints) {
        var name = this.getSegment(breakpoints[i]).to;
        self.actions[direction][name] = self.actions[direction][name] || [];
        self.actions[direction][name].push(callback);
      }
    }

    return this;
  };

  return BreakpointX;
})(jQuery, window);

if (typeof module === 'object' && module.exports) {
  module.exports = BreakpointX;
}
