# BreakpointX (Breakpoint Crossing)

Define responsive breakpoints, register callbacks when crossing, with optional css class handling.

# Example

## Create a new instance, define breakpoints

    // Register three breakpoints that indicate these sections on the horizontal axis:
    // - 0px - 239px
    // - 240px - 767px
    // - 768px +
    var bp = new BreakpointX([0, 240, 768]);

## Find the breakpoint by a horizontal, x value.

    var alias = bp.alias(240);
    // alias === '(max-width: 767px)';

    var alias = bp.alias(200);
    // alias === '(max-width: 239px)';

    var alias = bp.alias(300);
    // alias === '(max-width: 767px)';

    var alias = bp.alias(1080);
    // alias === '(min-width: 768px)';

## Register a callback to fire

    // When the window crosses 768 getting smaller
    bp.add('smaller', ['(max-width: 767px)'], function () {
      console.log('Now you\'re in (max-width: 767px)!');
    });

    // When the window crosses 768 getting bigger
    bp.add('bigger', ['(max-width: 767px)'], function () {
      console.log('Now you\'re in (max-width: 767px)!');
    });

    // When the window crosses any breakpoint in either direction
    bp.add('both', bp.aliases, function () {
      console.log('Now you\'re in (max-width: 767px)!');
    });


## Alternative: Create a new instance with named aliases

    var bp = new BreakpointX([{small: 0, medium: 240, large: 768}]);

## Add a class to an element reflecting the current breakpoint

    var bp = new BreakpointX([{mobile: 0, desktop: 768}], {
      addClassesTo: 'body'
    });

The body element will look like this when the browser gets larger and crosses 768px.
    
    <body class="bpx-desktop bpx-bigger">