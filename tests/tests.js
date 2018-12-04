/**
 * @file
 * Tests provided against the BreakpointX class.
 *
 * @ingroup breakpointX
 * @{
 */
var QUnit = QUnit || {};
QUnit.storage = {};
var BreakpointX = BreakpointX || {};
var breakpoints = {"tiny": 0, "mobile": 241, "desktop": 769};
var obj = {};

//
//
// Build your tests below here...
//

QUnit.test("Assert alias(last) works.", function (assert) {
  var bp = new BreakpointX([0,480,768,1080]);
  assert.strictEqual(bp.alias('first'), 'max-width:479px');
  assert.strictEqual(bp.alias('last'), 'min-width:1080px');
});

QUnit.test("test query method", function (assert) {
  var bp = new BreakpointX({"small": 0, "mobile": 480, "desktop": 768});
  assert.strictEqual(bp.query('small'), 'max-width:479px');
  assert.strictEqual(bp.query('mobile'), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.query('desktop'), 'min-width:768px');
});

QUnit.test("Assert named aliases appear as obj.aliases.", function(assert) {
  var bp = new BreakpointX({"mobile": 0, "desktop": 768});
  assert.strictEqual('mobile', bp.aliases[0]);
  assert.strictEqual('desktop', bp.aliases[1]);
});

QUnit.test("Assert that breakpoints as an array of values works.", function (assert) {
  var bp = new BreakpointX([0,480,768,1080]);
  assert.deepEqual(bp.aliases, ['max-width:479px','(min-width:480px) and (max-width:767px)','(min-width:768px) and (max-width:1079px)','min-width:1080px']);
  assert.strictEqual(bp.alias(0), 'max-width:479px');
  assert.strictEqual(bp.alias(100), 'max-width:479px');
  assert.strictEqual(bp.alias(320), 'max-width:479px');
  assert.strictEqual(bp.alias(479), 'max-width:479px');

  assert.strictEqual(bp.alias(480), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(500), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(600), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(767), '(min-width:480px) and (max-width:767px)');

  assert.strictEqual(bp.alias(768), '(min-width:768px) and (max-width:1079px)');

  assert.strictEqual(bp.alias(1080), 'min-width:1080px');
  assert.strictEqual(bp.alias(2560), 'min-width:1080px');
});

QUnit.test("Assert classes are not added to the html tag when options set.", function(assert) {
  var bp = new BreakpointX({"desktop": 0});
  assert.notOk($('html').hasClass('bpx-desktop'));
});


QUnit.test("Assert classes are added to the html tag when options set.", function(assert) {
  assert.notOk($('html').hasClass('bpx-desktop'));
  var bp = new BreakpointX({"desktop": 0}, {"addClassesTo": "html"});
  assert.ok($('html').hasClass('bpx-desktop'));
});

QUnit.test("Assert instantiation without callbacks still shows this.current and this.last.", function(assert) {
  var bp = new BreakpointX({"mainWindow": 0});
  assert.strictEqual(bp.current, "mainWindow");
  assert.deepEqual(bp.last, {
    "alias": "mainWindow",
    "direction": null,
    "width": [0, null]
  });
});

QUnit.test("Assert instantiation without args throws error.", function(assert) {
  assert.throws(function () {
    var bp = new BreakpointX();
  });
});

QUnit.test("Assert breakpoints out of order are put into asc order.", function(assert) {
  var outOfOrder = {
    desktop: 769,
    mobile: 320,
    tiny: 0,
  };
  var bp      = new BreakpointX(outOfOrder);
  var result  = [];
  for (var breakpoint in bp.breakpoints) {
    result.push(bp.breakpoints[breakpoint]);
  }

  assert.deepEqual(result, [[0, 319], [320, 768], [769, null]]);
  assert.deepEqual(bp.aliases, ['tiny', 'mobile', 'desktop']);
});

QUnit.test("Assert two breakpoints with string values works.", function(assert) {
  var bp = new BreakpointX({"mobile": "0px", "desktop": "769px"});

  assert.strictEqual(bp.alias(320), 'mobile');
  assert.strictEqual(bp.alias(768), 'mobile');
  assert.strictEqual(bp.alias(769), 'desktop');
  assert.strictEqual(bp.alias(1024), 'desktop');
  assert.strictEqual(bp.alias(1600), 'desktop');
  assert.strictEqual(bp.alias(0), 'mobile');
});

QUnit.test("Assert alias method works.", function(assert) {
  assert.strictEqual(obj.alias(321), 'mobile');
  assert.strictEqual(obj.alias(240), 'tiny');
  assert.strictEqual(obj.alias(320), 'mobile');
  assert.strictEqual(obj.alias(700), 'mobile');
  assert.strictEqual(obj.alias(768), 'mobile');
  assert.strictEqual(obj.alias(769), 'desktop');
  assert.strictEqual(obj.alias(1280), 'desktop');
  assert.strictEqual(obj.alias(1600), 'desktop');
  assert.strictEqual(obj.alias(1601), 'desktop');
});

QUnit.test("Assert two breakpoints alias works.", function(assert) {
  var bp = new BreakpointX({"mobile": 0, "desktop": 769});

  assert.strictEqual(bp.alias(320), 'mobile');
  assert.strictEqual(bp.alias(768), 'mobile');
  assert.strictEqual(bp.alias(769), 'desktop');
  assert.strictEqual(bp.alias(1024), 'desktop');
  assert.strictEqual(bp.alias(1600), 'desktop');
  assert.strictEqual(bp.alias(0), 'mobile');
});

QUnit.test("Assert reset sets the current window width.", function(assert) {
  obj.reset();
  var width = $(window).width();
  var alias = obj.alias(width);
  assert.strictEqual(obj.last.alias, alias);
  assert.strictEqual(obj.last.width, obj.value(alias));
  assert.strictEqual(obj.current, alias);
});

QUnit.test("Assert reset clears actions.", function(assert) {
  var called = false;
  obj.add('both', ['tiny'], function () {
    called = true;
  });
  obj.add('bigger', ['tiny'], function () {
    called = true;
  });
  obj.add('smaller', ['tiny'], function () {
    called = true;
  });
  assert.strictEqual(obj.actions.bigger.tiny.length, 1);
  assert.strictEqual(obj.actions.smaller.tiny.length, 1);
  assert.strictEqual(obj.actions.both.tiny.length, 1);

  obj.reset();
  assert.strictEqual(obj.actions.bigger.length, 0);
  assert.strictEqual(obj.actions.smaller.length, 0);
  assert.strictEqual(obj.actions.both.length, 0);
});

QUnit.test("Assert non-function to add() throws error.", function(assert) {
  assert.throws(function () {
    obj.add('both', ['tiny'], 'tree');
  });
});

QUnit.test("Assert empty breakpoints to add() throws error.", function(assert) {
  assert.throws(function () {
    obj.add('both', [], function () {
      var called = true;
    });
  });
});

QUnit.test("Assert bad direction to add() throws error.", function(assert) {
  assert.throws(function () {
    obj.add('hungry', ['tiny'], function () {
      var called = true;
    });
  });
});

QUnit.test("Assert add 'both' works.", function(assert) {
  assert.strictEqual(obj.actions.both.length, 0);
  obj.add('both', ['tiny'], function () {
    called = true;
  });
  assert.strictEqual(obj.actions.both.tiny.length, 1);
});

QUnit.test("Assert add 'bigger' works.", function(assert) {
  assert.strictEqual(obj.actions.bigger.length, 0);
  obj.add('bigger', ['tiny'], function () {
    called = true;
  });
  assert.strictEqual(obj.actions.bigger.tiny.length, 1);
});

QUnit.test("Assert add 'smaller' works.", function(assert) {
  assert.strictEqual(obj.actions.smaller.length, 0);
  obj.add('smaller', ['tiny'], function () {
    called = true;
  });
  assert.strictEqual(obj.actions.smaller.tiny.length, 1);
});

QUnit.test("Assert value method works.", function(assert) {
  assert.deepEqual(obj.value('tiny'), [0, 240]);
  assert.deepEqual(obj.value('mobile'), [241, 768]);
  assert.deepEqual(obj.value('desktop'), [769, null]);
});

QUnit.test("Able to instantiate and find version.", function(assert) {
  var breakpointX = new BreakpointX(breakpoints);
  assert.ok(breakpointX instanceof BreakpointX, "Instantiated object is an instance of BreakpointX.");
  assert.ok(breakpointX.version, "Version is not empty.");
});

//
//
// Per test setup
//
QUnit.testStart(function (details) {
  // Create a new DOM element #test, cloned from #template.
  $('#test').replaceWith(QUnit.storage.$template.clone().attr('id', 'test'));

  // Create a new breakpointX to be used in each test.
  obj = new BreakpointX(breakpoints);
});

QUnit.testDone(function () {
  // Reset out class prototype, which may have been altered in a test.
  BreakpointX.prototype = QUnit.storage.prototype;

  // Reset the html classes per the default.
  $('html').attr('class', QUnit.storage.htmlClass);
});

// Callback fires before all tests.
QUnit.begin(function () {
  QUnit.storage.htmlClass = $('html').attr('class') || '';
  QUnit.storage.prototype = $.extend({}, BreakpointX.prototype);
  QUnit.storage.$template = $('#template').clone();
  $('#template').replaceWith(QUnit.storage.$template.clone().attr('id', 'test'));
});

// Callback fires after all tests.
QUnit.done(function () {
  $('#test').replaceWith(QUnit.storage.$template);
});
