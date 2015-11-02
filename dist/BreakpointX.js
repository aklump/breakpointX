/**
 * BreakpointX JavaScript Module v0.1
 * 
 *
 * Define breakpoints and register callbacks when crossed.
 *
 * Copyright 2015, Aaron Klump <sourcecode@intheloftstudios.com>
 * @license Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Mon Nov  2 13:35:11 PST 2015
 */
/**
 * 
 * Each breakpoint consists of a minimum width and an alias.
 * Each viewport is the span of the breakpoint minimum width to one pixel
 * less than the next-larger breakpoint's minimum width.
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
 *
 * Available using jQuery syntax
 * @code
 *   var breakpointx = $('body').breakpointx().data('breakpointx');
 * @endcode
 */
var BreakpointX = (function ($) {

  function BreakpointX (breakpoints, settings) {
    this.version     = "0.1";
    this.settings    = $.extend({}, this.options, settings);

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
  BreakpointX.prototype.options = {};

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
      throw new Error("breakpoints should be an object in this format: {alias: width} where width is the maximum width of the viewport");
    }    

    // Make sure that breakpoint values are integars in pixels.
    self.aliases = [];
    for (var alias in breakpoints) {
      self.aliases.push(alias);
      breakpoints[alias] = parseInt(breakpoints[alias], 10);
    }
    
    self.breakpoints = breakpoints;
    self.reset();
    self.last.alias = this.alias(window.innerWidth);
    self.last.width = this.value(self.last.alias);

    $(window).resize(function () {
      var winWidth  = window.innerWidth;
      var direction = winWidth > self.last.width ? 'bigger' : 'smaller';
      var callbacks = [self.actions[direction], self.actions.both];
      var bp        = null;
      for (var i in callbacks) {
        for (var bpAlias in callbacks[i]) {
          var lastAlias = lastAlias || null;
          bp            = self.value(bpAlias);
          var crossed   = self.last.width < bp && winWidth > bp || self.last.width > bp && winWidth < bp;
          if (crossed) {
            var from = direction === 'bigger' ? lastAlias : bpAlias;
            var to   = bpAlias;
            for (var j in callbacks[i][bpAlias]) {
              console.log(from, to, direction);
              callbacks[i][bpAlias][j](from, to, direction, self);
            }
            self.last = {"width": bp, "alias": bpAlias, "direction": direction};
          }
          lastAlias = bpAlias;
        }
      }
    });

    return self;
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
      found = found || alias; 
      if (width < this.breakpoints[alias]) {
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
   *   - 0 The breakpoint alias moving from. (To get the pixel value use arg#3.value())
   *   - 1 The alias/name of the new viewport.
   *   - 2 The direction string.
   *   - 3 The current BreakpointX object.
   */
  BreakpointX.prototype.add = function (direction, breakpoints, callback) {
    var self = this;
    if (typeof self.actions[direction] === 'undefined') {
      throw new Error('Invalid direction: ' + direction);
    }
    else if (breakpoints.length < 1) {
      throw new Error('breakpoints must be an array with at least one alias.');
    }
    else if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }
    else {
      for (var i in breakpoints) {
        var alias = breakpoints[i];
        if (self.aliases.indexOf(alias) === -1) {
          throw new Error('Unregistered breakpoint alias: "' + alias + '"');
        }
        self.actions[direction][alias] = self.actions[direction][alias] || [];  
        self.actions[direction][alias].push(callback);
      }
    }

    return this;
  };

  return  BreakpointX;
})(jQuery);
