/**
 * BreakpointX JavaScript Module v0.2.1
 * 
 *
 * Define responsive breakpoints, register callbacks when crossing, with optional css class handling.
 *
 * Copyright 2015, Aaron Klump <sourcecode@intheloftstudios.com>
 * @license Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Tue Nov  3 07:13:14 PST 2015
 */
/**
 * 
 * Each breakpoint consists of a minimum width and an alias.
 * Each viewport is the span of the breakpoint minimum width to one pixel
 * less than the next-larger breakpoint's minimum width.  The largest breakpoint
 * has no maximum width.
 *
 * Access the current viewport using this.current; but this will only work if
 * you provide callbacks, using this.add().
 * 
 * @code
 *   breakpointX
 *   .init({tiny: 0, mobile: 241, desktop: 769})
 *   .add('smaller', ['desktop'], function () {
 *     console.log('Now you\'re in mobile!');
 *   })
 *   .add('smaller', ['tiny'], function () {
 *     console.log('Now you\'re in tiny!');
 *   })
 *   .add('bigger', ['desktop'], function () {
 *     console.log('Now you\'re in desktop!');
 *   });
 *   
 *   breakpointX.add('both', ['desktop', 'tiny'], function (from, to, direction, bp) {
 *     var pixels = bp.value(to);
 *     console.log('Previous viewport was: ' + from);
 *     console.log('Breakpoint ' + to + ' (' + pixels + ') has been crossed getting ' + direction + '.');
 *   });
 * @endcode
 *
 * Available in the global scope as:
 * @code
 *   var breakpointx = new BreakpointX();
 * @endcode
 */
var BreakpointX = (function ($) {

  function BreakpointX (breakpoints, settings) {
    this.version     = "0.2.1";
    this.settings    = $.extend({}, this.options, settings);
    this.current     = null;
    this.last        = {};
    this.actions     = {};
    this.breakpoints = {};
    this.aliases     = [];
    
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
   *   var bp = new BreakpointX({tiny: 0, mobile: 241, desktop: 769});
   *   bp.alias(240) === 'tiny';
   *   bp.alias(320) === 'mobile';
   *   bp.alias(321) === 'mobile';
   *   bp.alias(768) === 'mobile';
   *   bp.alias(769) === 'desktop';

   * @endcode
   *
   * ... the following will be true:
   * 
   */
  BreakpointX.prototype.init = function(breakpoints) {
    var self = this;
    if (typeof breakpoints !== 'object') {
      throw ("Object needs format {alias: minWidth}.");
    }    

    // Make sure that breakpoint values are integars in pixels and listed in
    // ascending order; calculate the maxWidth values.
    self.aliases = [];
    var sortable = [];
    var alias, pixels;
    for (alias in breakpoints) {
      pixels = parseInt(breakpoints[alias], 10);
      sortable.push([alias, pixels]);
    }
    sortable.sort(function (a, b) {
      return a[1] - b[1];
    });
    for (var i in sortable) {
      i *= 1;
      minWidth = sortable[i][1];
      alias  = sortable[i][0];
      self.aliases.push(alias);
      var maxWidth = typeof sortable[i + 1] === 'undefined' ? null : sortable[i + 1][1] - 1;
      self.breakpoints[alias] = [minWidth, maxWidth];
    }
    
    self.reset();

    // Register our own handler if we're to manipulate classes.
    if (this.settings.addClassesTo) {
      self.add('both', this.aliases, this.cssHandler);
    }

    if (self.actions.hasOwnProperty('bigger') || self.actions.hasOwnProperty('smaller') || self.actions.hasOwnProperty('both')) {

      var winWidth = window.innerWidth;
      self.callbacksHandler(winWidth, true);

      $(window).resize(function () {
        winWidth     = window.innerWidth;
        self.callbacksHandler(winWidth);
      });
    }

    return self;
  };

  BreakpointX.prototype.cssHandler = function (from, to, direction, self) {
    $el = self.settings.addClassesTo instanceof jQuery ? self.settings.addClassesTo : $(self.settings.addClassesTo);
    var p = self.settings.classPrefix;
    $el
    .removeClass(p + 'smaller')
    .removeClass(p + 'larger')
    .removeClass(p + from.name)
    .addClass(p + to.name);
    if (direction) {
      $el.addClass(p + direction);
    }
  };

  BreakpointX.prototype.callbacksHandler = function (width, force) {
    var self = this;
    var currentAlias = self.alias(width);
    var crossed      = currentAlias !== self.last.alias;

    if (crossed || force) {
      var direction    = crossed ? (width > self.last.width ? 'bigger' : 'smaller') : null;
      var callbacks    = [self.actions.both];
      if (direction) {
        callbacks.push = self.actions[direction];
      }

      self.last = {
        "width": self.value(currentAlias),
        "alias": currentAlias,
        "direction": direction
      };
      self.current = currentAlias;

      for (var i in callbacks) {
        var from = {
          minWidth: self.breakpoints[self.last.alias][0],
          maxWidth: self.breakpoints[self.last.alias][1],
          name: self.last.alias
        };
        var to = {
          minWidth: self.breakpoints[currentAlias][0],
          maxWidth: self.breakpoints[currentAlias][1],
          name: currentAlias
        };
        for (var j in callbacks[i][currentAlias]) {
          callbacks[i][currentAlias][j](from, to, direction, self);
        }
      }
    }  
  };

  /**
   * Clears all callbacks
   *
   * @return {this}
   */
  BreakpointX.prototype.reset = function() {
    this.actions = {
      "bigger": [],
      "smaller": [],
      "both": []
    };
    this.last = {"width": null, "alias": null, "direction": null};
    
    // Set values based on current window.
    this.last.alias = this.alias(window.innerWidth);
    this.last.width = this.value(this.last.alias);
    this.current    = this.last.alias;

    return this;
  };

  /**
   * Return the alias of a pixel width.
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
   * @param  {string} alias E.g. 'desktop'
   *
   * @return {int} The pixel value.
   */
  BreakpointX.prototype.value = function (alias) {
    return typeof this.breakpoints[alias] === 'undefined' ? null : this.breakpoints[alias];
  };

  /**
   * Register a callback to be executed when the window crosses one or more
   * breakpoints getting smaller, larger or in both directions.
   *
   * @param {string} direction One of: smaller, larger, both
   * @param {array} breakpoints E.g. [mobile, desktop] These are aliases not values.
   * @param {Function} callback A callback to be executed.  CAllbacks receive:
   *   - 0 The object moving from: {minWidth, maxWidth, name}
   *   - 1 The object moving to...
   *   - 2 The direction string.
   *   - 3 The current BreakpointX object.
   */
  BreakpointX.prototype.add = function (direction, breakpoints, callback) {
    var self = this;
    if (typeof self.actions[direction] === 'undefined') {
      throw ('Bad direction: ' + direction);
    }
    else if (breakpoints.length === 0) {
      throw ('Breakpoints must be an array of aliases.');
    }
    else if (typeof callback !== 'function') {
      throw ('Callback must be a function');
    }
    else {
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

  return  BreakpointX;
})(jQuery);
