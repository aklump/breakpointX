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
 * Access the current viewport using this.current; but this will only work if
 * you provide callbacks, using this.add().
 *
 * @code
 *   var bp = new BreakpointX({small: 0, medium: 240, large: 768});
 *   bp
 *   .add('smaller', ['large'], function () {
 *     console.log('Now you\'re in medium!');
 *   })
 *   .add('smaller', ['small'], function () {
 *     console.log('Now you\'re in small!');
 *   })
 *   .add('bigger', ['large'], function () {
 *     console.log('Now you\'re in large!');
 *   });
 *
 *   breakpointX.add('both', ['large', 'small'], function (from, to, direction)
 *   { var pixels = this.value(to); console.log('Previous viewport was: ' +
 *   from); console.log('Breakpoint ' + to + ' (' + pixels + ') has been
 *   crossed getting ' + direction + '.');
 *   });
 * @endcode
 *
 * You can also just send min widths like this:
 * @code
 *   var bp = new BreakpointX([0, 240, 768]);
 *   bp.alias(240) === '(max-width: 767px)';
 *
 *   bp.add('smaller', ['(max-width: 767px)'], function (from, to, direction) {
 *     console.log('Now you\'re in (max-width: 767px)!');
 *   })
 * @endcode
 */
var BreakpointX = (function($, window) {

  /**
   * Helper function to determine the media query by raw data.
   *
   * @param int lower_breakpoint The lower breakpoint value.
   * @param int upper_breakpoint The upper breakpoint value.
   * @returns {string}
   * @private
   */
  function _query(leftBreakpointValue, breakpointValue) {
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

  function BreakpointX(breakpoints, settings) {
    this.version = '__version';
    this.settings = $.extend({}, this.options, settings);
    this.settings.breakpoints = breakpoints;
    this.current = null;
    this.last = {};
    this.actions = {};

    // @deprecated Use this.segmentNames instead.
    this.breakpoints = {};

    // @deprecated Use this.segmentNames instead.
    this.aliases = [];

    this.segments = {};
    this.segmentNames = [];
    this.init(breakpoints);
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
     * changes.
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
   *   var bp = new BreakpointX({small: 0, medium: 241, large: 769});
   *   bp.alias(240) === 'small';
   *   bp.alias(320) === 'medium';
   *   bp.alias(321) === 'medium';
   *   bp.alias(768) === 'medium';
   *   bp.alias(769) === 'large';

   * @endcode
   *
   * ... the following will be true:
   *
   */
  BreakpointX.prototype.init = function(breakpoints) {
    var self = this,
      i;
    //
    //
    // Convert numeric keys to media queries.
    //
    var converted = {};
    if (breakpoints instanceof Array) {
      breakpoints.unshift(0);
      if (breakpoints[breakpoints.length - 1] !== Infinity) {
        breakpoints.push(Infinity);
      }
      var next;
      for (i in breakpoints) {
        next = i * 1 + 1;
        var query = _query(
          breakpoints[i],
          breakpoints[next] || Infinity
        );
        if (breakpoints[next]) {
          converted[query] = breakpoints[next];
        }
      }
      breakpoints = converted;
    }
    if (typeof breakpoints !== 'object') {
      throw ('Object needs format {alias: minWidth}.');
    }

    // Make sure that breakpoint values are integers in pixels and listed in
    // ascending order; calculate the maxWidth values.
    self.aliases = [];
    var sortable = [];
    var alias, pixels, minWidth, maxWidth;
    for (alias in breakpoints) {
      var breakpointValue = breakpoints[alias];
      if (breakpointValue === 0) {
        throw new Error('A breakpoint must be greater than 0');
      }
      if (breakpointValue !== Infinity) {
        breakpointValue = parseInt(breakpointValue, 10);
      }
      sortable.push([alias, breakpointValue]);
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
      self.segments[segmentName] = {
        name: segmentName,
        type: type,
        from: leftBreakpointValue,

        // I've made the decision to set the "to" the same as the breakpoint
        // because in theory, the left segments ends at the same point where
        // the right segment or ray beings; and the segment should contain the
        // breakpoint it's named after.  However with a computer, you can't
        // share a pixel, therefor the "width" value is included here, which is
        // -1.  Also you will notice that the media queries are generated using
        // the to - 1 as well.
        to: breakpointValue === Infinity ? Infinity : breakpointValue,

        // This is calculated 1px less than the breakpoint and
        // represents the maximum number of pixels that fit into this segment
        // before the breakpoint is crossed.
        pixelWidth: breakpointValue === Infinity ? Infinity : breakpointValue - 1,
        breakpoint: breakpointValue === Infinity ? undefined : breakpointValue,
        '@media': _query(leftBreakpointValue, breakpointValue),

        // Images for this segment should have this width.
        imageWidth: type === 'segment' ? breakpointValue - 1 : parseInt(leftBreakpointValue * self.settings.breakpointRayImageWidthRatio, 10),
      };
      self.breakpoints[segmentName] = this.value(segmentName);
      self.aliases.push(segmentName);
      self.segmentNames.push(segmentName);
      leftBreakpointValue = breakpointValue;
    }
    self.reset();

    // Register our own handler if we're to manipulate classes.
    if (this.settings.addClassesTo) {
      self.add('both', this.segmentNames, this.cssHandler);
    }

    if (self.actions.hasOwnProperty('bigger') || self.actions.hasOwnProperty('smaller') || self.actions.hasOwnProperty('both')) {

      var winWidth = self.getWindowWidth();
      self.callbacksHandler(winWidth, true);

      var throttleSpeed = self.settings.resizeThrottle;
      var throttle = null;
      $(window).resize(function() {
        clearTimeout(throttle);
        throttle = setTimeout(function() {
          winWidth = self.getWindowWidth();
          self.callbacksHandler(winWidth);
        }, throttleSpeed);
      });
    }

    return self;
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

  BreakpointX.prototype.cssHandler = function(from, to, direction) {
    var $el = this.settings.addClassesTo instanceof jQuery ? this.settings.addClassesTo : $(this.settings.addClassesTo),
      p = this.settings.classPrefix;
    $el
      .removeClass(p + 'smaller')
      .removeClass(p + 'bigger')
      .removeClass(p + from.name)
      .addClass(p + to.name);
    if (direction) {
      $el.addClass(p + direction);
    }
  };

  BreakpointX.prototype.callbacksHandler = function(width, force) {
    var self = this,
      currentAlias = self.alias(width),
      crossed = currentAlias !== self.last.alias;
    if (crossed || force) {
      var direction = crossed ? (width > self.last.width[0] ? 'bigger' : 'smaller') : null,
        callbacks = [self.actions.both];
      if (direction) {
        callbacks.push(self.actions[direction]);
      }

      // We've just moved from self.last.alias to currentAlias so we need to
      // get all the breakpoint aliases that we have crossed.
      var breakpointsCrossed = [],
        bp,
        from,
        to,
        alias;
      if (direction === 'smaller') {
        breakpointsCrossed.push(self.last.alias);
        from = this.value(self.last.alias);
        from = from[0];
        to = this.value(currentAlias);
        to = to[1];
        for (alias in this.breakpoints) {
          bp = this.breakpoints[alias][1];
          if (to < bp && bp < from) {
            breakpointsCrossed.push(alias);
          }
        }
      } else {
        breakpointsCrossed.push(currentAlias);
        from = this.value(currentAlias);
        from = from[0];
        to = this.value(self.last.alias);
        to = to[1];
        for (alias in this.breakpoints) {
          bp = this.breakpoints[alias][0];
          if (to < bp && bp < from) {
            breakpointsCrossed.push(alias);
          }
        }
      }

      // Update for next round.
      from = self.segments[self.last.alias];
      to = self.segments[currentAlias];

      self.current = currentAlias;

      // Fire off all callbacks.
      for (var k in breakpointsCrossed) {
        var breakpoint = breakpointsCrossed[k];
        for (var i in callbacks) {
          for (var j in callbacks[i][breakpoint]) {
            callbacks[i][breakpoint][j].call(self, from, to, direction);
          }
        }
      }

      self.last = {
        'width': self.value(currentAlias),
        'alias': currentAlias,
        'direction': direction
      };
    }
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
    this.last = { 'width': null, 'alias': null, 'direction': null };

    // Set values based on current window.
    this.last.alias = this.alias(this.getWindowWidth());
    this.last.width = this.value(this.last.alias);
    this.current = this.last.alias;

    return this;
  };

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
   * still return the highest defined breakpoint alias.
   *
   * @return {string}
   *
   * @deprecated
   */
  BreakpointX.prototype.alias = function(width) {

    if (width === 'first') {
      return this.segmentNames[0];
    }
    if (width === 'last') {
      return this.segmentNames[this.segmentNames.length - 1];
    }
    for (var name in this.segments) {
      var segment = this.segments[name];
      if (segment.from <= width && width < segment.breakpoint) {
        return name;
      } else if (segment.to === Infinity && width >= segment.from) {
        return name;
      }
    }
    return null;
  };

  BreakpointX.prototype.getBreakpointRay = function() {
    var last = this.alias('last');
    return this.getSegmentByName(last);
  };

  /**
   * Return a segment definition given a point anywhere on the axis.
   *
   * @param int|Infinity point_value
   *   The point along the axis.
   *
   * @returns {{}|undefined}
   */
  BreakpointX.prototype.getSegmentByPoint = function(point_value) {
    var segment_name = this.alias(point_value);
    return this.getSegmentByName(segment_name);
  };

  /**
   * Return a segment definition given it's name.
   *
   * @param string name
   *   The name of a segment.
   *
   * @returns {{}|undefined}
   */
  BreakpointX.prototype.getSegmentByName = function(segment_name) {
    return this.segments[segment_name] || undefined;
  };

  /**
   * Return a segment definition given it's name.
   *
   * @param string media_query
   *   The media query for a segment.
   *
   * @returns {{}|undefined}
   */
  BreakpointX.prototype.getSegmentByMediaQuery = function(media_query) {

    for (var name in this.segments) {
      var segment = this.segments[name];
      if (segment && segment['@media'].replace(/ /g, '') === media_query.replace(/ /g, '')) {
        return segment;
      }
    }
    return undefined;
  };

  /**
   * Current the segment represented by the current window width.
   *
   * @returns {{}|undefined}
   */
  BreakpointX.prototype.getSegmentByWindow = function() {
    var width = this.getWindowWidth();
    return this.getSegmentByPoint(width);
  };

  /**
   * Return the pixel value of a breakpoint alias.
   *
   * This is the same as the values used in the @media query
   *
   * @param  {string} alias E.g. 'large'
   *
   * @return {array} [min, max]
   *
   * @deprecated
   */
  BreakpointX.prototype.value = function(alias) {
    if (typeof this.segments[alias] === 'undefined') return null;
    var value = [
      this.segments[alias].from,
      this.segments[alias].breakpoint,
    ];
    value[0] = value[0] > 0 ? value[0] : value[0];
    value[1] = value[1] ? value[1] - 1 : null;
    return value;
  };

  /**
   * Return the media query string for an alias.
   *
   * @param string alias
   *   The alias name
   *
   * @return string
   *   The media query string, e.g. 'min-width: 769px'.
   */
  BreakpointX.prototype.query = function(alias) {
    if (typeof this.segments[alias] === 'undefined') return null;
    return this.segments[alias]['@media'];
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
   *   A callback to be executed.  CAllbacks receive:
   *   - 0 The object moving from: {minWidth, maxWidth, name}
   *   - 1 The object moving to...
   *   - 2 The direction string.
   *   - The current BreakpointX object is available as this
   */
  BreakpointX.prototype.add = function(direction, segmentNames, callback) {
    var self = this;
    if (typeof self.actions[direction] === 'undefined') {
      throw ('Bad direction: ' + direction);
    } else if (segmentNames.length === 0) {
      throw ('segmentNames must be an array of aliases.');
    } else if (typeof callback !== 'function') {
      throw ('Callback must be a function');
    } else {
      for (var i in segmentNames) {
        var name = segmentNames[i];
        if (self.segmentNames.indexOf(name) === -1) {
          throw ('Unknown name: "' + name + '"');
        }
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
