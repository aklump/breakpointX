/**
 * Breakpoint X (Crossing) jQuery Plugin v0.4.11
 * https://github.com/aklump/breakpointX#readme
 *
 * Define responsive breakpoints, register callbacks when crossing, with optional css class handling.
 *
 * Copyright 2015-2018, Aaron Klump <sourcecode@intheloftstudios.com>
 *
 * @license Dual licensed under the MIT or GPL Version 3 licenses.
 *
 * Date: Tue Dec  4 15:57:23 PST 2018_string
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
  function _query(lower_breakpoint, upper_breakpoint) {
    if (null !== upper_breakpoint) {
      --upper_breakpoint;
    }
    if (lower_breakpoint == 0) {
      return 'max-width:' + upper_breakpoint + 'px';
    } else if (null === upper_breakpoint) {
      return 'min-width:' + lower_breakpoint + 'px';
    }

    return '(min-width:' + lower_breakpoint + 'px) and (max-width:' + upper_breakpoint + 'px)';
  }

  function BreakpointX(breakpoints, settings) {
    this.version = '0.4.11';
    this.settings = $.extend({}, this.options, settings);
    this.settings.breakpoints = breakpoints;
    this.current = null;
    this.last = {};
    this.actions = {};
    this.breakpoints = {};
    this.aliases = [];
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
     */
    resizeThrottle: 200
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
      var value, next;
      for (i in breakpoints) {
        next = i * 1 + 1;
        var query = _query(
          breakpoints[i],
          typeof breakpoints[next] !== 'undefined' ? breakpoints[next] * 1 : null
        );
        converted[query] = breakpoints[i];
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
      pixels = parseInt(breakpoints[alias], 10);
      sortable.push([alias, pixels]);
    }
    sortable.sort(function(a, b) {
      return a[1] - b[1];
    });
    for (i in sortable) {
      i *= 1;
      minWidth = sortable[i][1];
      alias = sortable[i][0];
      self.aliases.push(alias);
      maxWidth = typeof sortable[i + 1] === 'undefined' ? null : sortable[i + 1][1] - 1;
      self.breakpoints[alias] = [minWidth, maxWidth];
    }

    self.reset();

    // Register our own handler if we're to manipulate classes.
    if (this.settings.addClassesTo) {
      self.add('both', this.aliases, this.cssHandler);
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

          ////After page load, reduce the throttle speed
          //throttleSpeed = 200;
        }, throttleSpeed);
      });
    }

    return self;
  };

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
      from = {
        minWidth: self.breakpoints[self.last.alias][0],
        maxWidth: self.breakpoints[self.last.alias][1],
        name: self.last.alias
      };
      to = {
        minWidth: self.breakpoints[currentAlias][0],
        maxWidth: self.breakpoints[currentAlias][1],
        name: currentAlias
      };
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
    this.last.alias = this.alias(window.innerWidth);
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
   * still return the hightest defined breakpoint alias.
   *
   * @return {string}
   */
  BreakpointX.prototype.alias = function(width) {

    if (width === 'first') {
      return this.aliases[0];
    }
    if (width === 'last') {
      return this.aliases[this.aliases.length - 1];
    }

    var found;
    for (var alias in this.breakpoints) {
      var bp = this.breakpoints[alias][0];
      found = found || alias;
      if (width < bp) {
        return found;
      }
      found = alias;
    }

    return found;
  };

  /**
   * Return the pixel value of a breakpoint alias.
   *
   * @param  {string} alias E.g. 'large'
   *
   * @return {array} [min, max]
   */
  BreakpointX.prototype.value = function(alias) {
    return typeof this.breakpoints[alias] === 'undefined' ? null : this.breakpoints[alias];
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
    var value = this.value(alias),
      lower_breakpoint = value[0],
      upper_breakpoint = value[1] ? ++value[1] : null;
    return _query(lower_breakpoint, upper_breakpoint);
  };

  /**
   * Register a callback to be executed when the window crosses one or more
   * breakpoints getting smaller, larger or in both directions.
   *
   * @param {string} direction One of: smaller, larger, both
   * @param {array} breakpoints E.g. [medium, large] These are aliases not
   *   values.
   * @param {Function} callback A callback to be executed.  CAllbacks receive:
   *   - 0 The object moving from: {minWidth, maxWidth, name}
   *   - 1 The object moving to...
   *   - 2 The direction string.
   *   - The current BreakpointX object is available as this
   */
  BreakpointX.prototype.add = function(direction, breakpoints, callback) {
    var self = this;
    if (typeof self.actions[direction] === 'undefined') {
      throw ('Bad direction: ' + direction);
    } else if (breakpoints.length === 0) {
      throw ('Breakpoints must be an array of aliases.');
    } else if (typeof callback !== 'function') {
      throw ('Callback must be a function');
    } else {
      for (var i in breakpoints) {
        var alias = breakpoints[i];
        if (self.aliases.indexOf(alias) === -1) {
          throw ('Unknown alias: "' + alias + '"');
        }
        self.actions[direction][alias] = self.actions[direction][alias] || [];
        self.actions[direction][alias].push(callback);
      }
    }

    return this;
  };

  return BreakpointX;
})(jQuery, window);

if (typeof module === 'object' && module.exports) {
  module.exports = BreakpointX;
}
