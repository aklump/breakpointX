/**
 * BreakpointX JavaScript Module v0.1
 * 
 *
 * Define breakpoints and register callbacks when crossed.
 *
 * Copyright 2015, Aaron Klump <sourcecode@intheloftstudios.com>
 * @license Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Thu Oct 29 17:46:04 PDT 2015
 */
/**
 * @code
 *   breakpointX
 *   .init({desktop: 768, tiny: 320})
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
 *   breakpointX.add('both', ['desktop', 'tiny'], function (width, alias, direction, bp) {
 *     var pixels = bp.value(alias);
 *     console.log('Window width is: ' + width);
 *     console.log('Breakpoint ' + alias + ' (' + pixels + ') has been crossed getting ' + direction + '.');
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

  // $.fn.breakpointx = function(settings) {
  //   return this.each(function () {
  //     var $el = $(this);
  //     $el.data('breakpointx', new BreakpointX($el, settings));
  //   });
  // };

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
   *   E.g. {small_mobile:480, desktop:768}
   *
   * @return {[type]} [description]
   */
  BreakpointX.prototype.init = function(breakpoints) {
    var self = this;
    if (typeof breakpoints !== 'object') {
      throw new Error("breakpoints should be an object in this format: {alias: width}");
    }    

    // Make sure that breakpoint values are integars in pixels.
    self.aliases = [];
    for (var alias in breakpoints) {
      self.aliases.push(alias);
      breakpoints[alias] = parseInt(breakpoints[alias], 10);
    }
    
    self.lastWidth = window.innerWidth;

    self.breakpoints = breakpoints;
    self.reset();

    $(window).resize(function () {
      var width = window.innerWidth;
      var direction = width > self.lastWidth ? 'bigger' : 'smaller';
      var callbacks = [self.actions[direction], self.actions.both];
      for (var i in callbacks) {
        for (var breakpoint in callbacks[i]) {
          var bp = self.value(breakpoint);
          var crossed = self.lastWidth < bp && width > bp || self.lastWidth > bp && width < bp;
          if (crossed) {
            for (var j in callbacks[i][breakpoint]) {
              callbacks[i][breakpoint][j](width, breakpoint, direction, self);  
            }
          }
        }
      }
      self.lastWidth = width;
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

    return this;
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
   * @param {array} breakpoints E.g. [480, 768]
   * @param {Function} callback A callback to be executed.
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
