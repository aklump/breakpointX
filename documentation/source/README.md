# Breakpoint X (Crossing)

![Breakpoint X](images/breakpoint-x.jpg)

## Summary

This project provides a means to define horizontal breakpoints, which will fire JS callbacks when the browser width crosses said breakpoints.  It also allows for CSS classes to be applied to designated elements which reflect the current breakpoint.  It can be used when you need to do anything in Javascript based on window resizing.  The server-side component is useful if you're using a PHP-based CMS for coordinating breakpoints.

**Visit <https://aklump.github.io/breakpointX/> for full documentation.**

## Quick Start

Install using `yarn add @aklump/breakpointx` or `npm i @aklump/breakpointx`

## Contributing

If you find this project useful... please consider [making a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4E5KZHDQCEUV8&item_name=Gratitude%20for%20aklump%2Fbreakpoint_x).

## Usage

### Create a new instance, define breakpoints

    // Register three breakpoints that indicate these sections on the horizontal axis:
    // - 0px - 239px
    // - 240px - 767px
    // - 768px +
    var bp = new BreakpointX([0, 240, 768]);

### Find the breakpoint by a horizontal, x value.

    var alias = bp.alias(240);
    // alias === '(max-width: 767px)';

    var alias = bp.alias(200);
    // alias === '(max-width: 239px)';

    var alias = bp.alias(300);
    // alias === '(max-width: 767px)';

    var alias = bp.alias(1080);
    // alias === '(min-width: 768px)';

### Register a callback to fire

    // When the window crosses 768 getting smaller
    bp.add('smaller', ['(max-width: 767px)'], function () {
      console.log('Now you\'re in (max-width: 767px)!');
    });

    // When the window crosses 768 getting bigger
    bp.add('bigger', ['(max-width: 767px)'], function () {
      console.log('Now you\'re in (max-width: 767px)!');
    });

    // When the window crosses any breakpoint in either direction
    bp.add('both', bp.aliases, function (from, to, direction) {
      console.log('Now you\'re in: ' + to.name);
      console.log('Window just got ' + direction);
    });


### Alternative: Create a new instance with named aliases

    var bp = new BreakpointX([{small: 0, medium: 240, large: 768}]);

### Add a class to an element reflecting the current breakpoint

    var bp = new BreakpointX([{mobile: 0, desktop: 768}], {
      addClassesTo: 'body'
    });

The body element will look like this when the browser gets larger and crosses 768px.

    <body class="bpx-desktop bpx-bigger">

### PHP

For PHP usage the namespace `AKlump\\BreakpointX` should map to _node_modules/@aklump/breakpointx/_.  Here's an example for _composer.json_.

    {
        "autoload": {
            "psr-4": {
                "AKlump\\BreakpointX\\": "node_modules/@aklump/breakpointx"
            }
        }
    }
