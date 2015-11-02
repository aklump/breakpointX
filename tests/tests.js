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
  assert.strictEqual(obj.value('tiny'), 0);
  assert.strictEqual(obj.value('mobile'), 241);
  assert.strictEqual(obj.value('desktop'), 769);
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