## 0.7.4

* Added addByScreenWidth to address [possible issue](https://github.com/aklump/breakpointX/issues/2) reported with addDevice.

## 0.7.0

* addBreakpointCrossActionIncreasingOnly changed to addBreakpointCrossBiggerAction
* addBreakpointCrossActionDecreasingOnly changed to addBreakpointCrossSmallerAction

## 0.6.0

* Removed dependency on jQuery
* `addClassesTo: 'html'` changes to `addClassesTo: document.documentElement`
* addClassesTo now takes an element not a string or jQuery object.
* Removed deprecatated functions from 0.5.0.
* .last became .previousCallbackData and format changes.
* .current was removed.
* use .getSegmentByWindow() instead of .current.
* use .getSegment(0) instead of .alias('first').
* use .getRay() instead of .alias('last').
* .settings.breakpoints was removed.
* .breakpoints is now an array of breakpoint values.
* Constructor arguments have changed; see documentation for new format.
* addAction was replaced with multiple methods; see code for `add*` methods.

## 0.5.0

1. The way breakpoints are defined has changed.  The old syntax:

        var bp = new BreakpointX({"small": 0, "mobile": 480, "desktop": 768});

    Changes to:

        var bp = new BreakpointX({"small": 480, "mobile": 768, "desktop": Infinity});

2. The query method now returns all values wrapped in `()`.
3. The objects received by callbacks have changed in their structure.
4. Breakpoint values have to be greater than 0.

## 0.4.6

The path the to the PHP class has changed; you must update your autoloaders.
