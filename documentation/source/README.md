# Breakpoint X (Crossing)

![Breakpoint X](images/breakpoint-x.jpg)

## Summary

This project provides a means to define breakpoints along the horizontal axis of the window, which can fire JS callbacks when the width crosses those breakpoints.  It provides a setting, which will write CSS classes to designated elements.  It provides a PHP class with a simliar form, that can be useful if you're using, say, a CMS for coordinating breakpoints.

A breakpoint is defined as a single point along the horizontal axis.  To the left lies a segment, and to the right of the highest value breakpoint lies the ray.  To the right of all but the highest value breakpoint, likes a segment.  See the section below _Breakpoint Theory_.

**Visit <https://aklump.github.io/breakpointX/> for full documentation.**

## Quick Start

Install using `yarn add @aklump/breakpointx` or `npm i @aklump/breakpointx`

## Requirements

* jQuery >= 1.4

## Contributing

If you find this project useful... please consider [making a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=4E5KZHDQCEUV8&item_name=Gratitude%20for%20aklump%2Fbreakpoint_x).

## Breakpoint Theory

This cheatsheet will familiarize you with the terms used in this project.

![Cheatsheet](images/breakpoint-cheatsheet.png)

Download this [Cheatsheet](images/breakpoint-cheatsheet.pdf) by [In the Loft Studios](http://www.intheloftstudios.com)

### Common Mistakes

* By definition a _breakpoint_ does not have a width, nor does it have a minimum or a maximum; it's just a point.
* A CSS media query represents a _segment_ or _ray_ not a _breakpoint_.

## Usage

![Basic Usage](images/basic.png)

    var bp = new BreakpointX([480, 768]);

Then you can retrieve segment info, which includes items such as the width, from point, to point, media query, image width, name, and more.

    bp.getSegment(200);
    bp.getSegment(480);
    bp.getSegment(1000);
    
    var name = bp.getSegment(300).name;
    var query = bp.getSegment(300)['@media'];
    var imageWidth = bp.getSegment(300).imageWidth;

### Named Segments

It can be helpful to name your segments:

![Basic Usage](images/named.png)

    var obj = new BreakpointX([480, 768], ['small', 'medium', 'large']);

Then you can use the names to get segment info:

    bp.getSegment('small')['@media']

### CSS Classes

To cause CSS classes to be written on an element, pass the appropriate settings, where `addClassesTo` is a jQuery selector.

    // Breakpoints only with settings.
    var obj = new BreakpointX([768], ['mobile', 'desktop'], {
      addClassesTo: 'html',
      classPrefix: 'bpx-',
    });

The element will look like this when the browser gets larger and crosses 768px.

    <html class="bpx-desktop bpx-bigger">

### Callbacks When Breakpoints Are Crossed

When the window width changes, and a breakpoint is hit or crossed, callbacks can be registered to fire as a result. `this` points to the BreakpointX instance.

    // When the window crosses any breakpoint in either direction
    bp.addCrossAction(function(segment, direction, breakpoint, previousSegment) {
      ... do something in response.
    });

    // When the window crosses 768 in either direction
    bp.addBreakpointCrossAction(function(segment, direction, breakpoint, previousSegment) {
      ... do something in response.
    });

    // When the window crosses 768 getting smaller
    bp.addBreakpointCrossActionDecreasingOnly(768, function (segment, direction, breakpoint, previousSegment) {
      ... do something in response.
    });

    // When the window crosses 768 getting bigger
    bp.addBreakpointCrossActionIncreasingOnly(768, function (segment, direction, breakpoint, previousSegment) {
      ... do something in response.
    });

### In Terms of Devices

Here is an example which demonstrates how you might construct an instance when thinking in terms of physical devices.  It's given in PHP, however the JS methods are exactly the same.

![Device-centric appproach](images/devices.png)

    <?php
    $obj = new BreakpointX();
    $obj
      ->addDevice('iphone', 480)
      ->addDevice('ipad', 768)
      ->addDevice('desktop', 1024)
      ->renameSegment(0, 'small');


## PHP Support

While this is foremost a Javascript project, there is a PHP class that may be helpful to your use case.  Browser-related methods do not exist, but other methods share the same API as the JS object.  The class file is _node_modules/@aklump/breakpointx/dist/BreakpointX.php_.

    <?php
    $bp = new BreakpointX([480, 768]);
    
    $name = $bp->getSegment(300)['name'];
    $query = $bp->getSegment(300)['@media'];
    $imageWidth = $bp->getSegment(300)['imageWidth'];

### Autoloading

 For PSR autoloading the namespace `AKlump\\BreakpointX` should map to _node_modules/@aklump/breakpointx/dist_.  Here's an example for _composer.json_.

    {
        "autoload": {
            "psr-4": {
                "AKlump\\BreakpointX\\": "node_modules/@aklump/breakpointx/dist"
            }
        }
    }
