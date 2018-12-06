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
var breakpoints = { 'tiny': 241, 'mobile': 769, 'desktop': Infinity };
var obj = {};

//
//
// Build your tests below here...
//
QUnit.test('Assert classes are added to the html tag when options set.', function(assert) {
  assert.notOk($('html').hasClass('bpx-desktop'));
  new BreakpointX({ 'desktop': Infinity }, { 'addClassesTo': 'html' });
  assert.ok($('html').hasClass('bpx-desktop'));
});

QUnit.test('Assert reset sets internal pointers to last and current aliases.', function(assert) {
  var width = $(window).width();
  var alias = obj.alias(width);
  obj.reset();
  assert.strictEqual(obj.last.alias, alias);
  assert.strictEqual(obj.last.width, obj.value(alias));
  assert.strictEqual(obj.current, alias);
});

QUnit.test('Assert getBreakpointRay works', function(assert) {
  assert.strictEqual(obj.getBreakpointRay().name, 'desktop');

  obj = new BreakpointX([480, 768, 1080]);
  assert.strictEqual(obj.getBreakpointRay().name, '(min-width:1080px)');
});

QUnit.test('Assert alias works with first and last params.', function(assert) {
  var bp = new BreakpointX([480, 768, 1080]);
  assert.strictEqual(bp.alias('first'), '(max-width:479px)');
  assert.strictEqual(bp.alias('last'), '(min-width:1080px)');
});

QUnit.test('Assert that breakpoints as an array of values works.', function(assert) {
  var bp = new BreakpointX([0, 480, 768, 1080]);
  assert.deepEqual(bp.aliases, [
    '(max-width:479px)',
    '(min-width:480px) and (max-width:767px)',
    '(min-width:768px) and (max-width:1079px)',
    '(min-width:1080px)',
  ]);
  assert.strictEqual(bp.alias(0), '(max-width:479px)');
  assert.strictEqual(bp.alias(100), '(max-width:479px)');
  assert.strictEqual(bp.alias(320), '(max-width:479px)');
  assert.strictEqual(bp.alias(479), '(max-width:479px)');

  assert.strictEqual(bp.alias(480), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(500), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(600), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.alias(767), '(min-width:480px) and (max-width:767px)');

  assert.strictEqual(bp.alias(768), '(min-width:768px) and (max-width:1079px)');

  assert.strictEqual(bp.alias(1080), '(min-width:1080px)');
  assert.strictEqual(bp.alias(2560), '(min-width:1080px)');
});

QUnit.test('Assert reset clears actions.', function(assert) {
  var called = false;
  obj.add('both', ['tiny'], function() {
    called = true;
  });
  obj.add('bigger', ['tiny'], function() {
    called = true;
  });
  obj.add('smaller', ['tiny'], function() {
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


QUnit.test('Assert getSegmentByMediaQueryWorks', function(assert) {
  assert.deepEqual(obj.getSegmentByMediaQuery('(max-width:240px)').name, 'tiny');
  assert.deepEqual(obj.getSegmentByMediaQuery('(max-width: 240px)').name, 'tiny');
  assert.deepEqual(obj.getSegmentByMediaQuery('( max-width: 240px )').name, 'tiny');
  assert.deepEqual(obj.getSegmentByMediaQuery('(min-width:241px) and (max-width:768px)').name, 'mobile');
  assert.deepEqual(obj.getSegmentByMediaQuery('(min-width:241px)and(max-width:768px)').name, 'mobile');
  assert.deepEqual(obj.getSegmentByMediaQuery(' (min-width:241px) and (max-width: 768px)').name, 'mobile');
  assert.deepEqual(obj.getSegmentByMediaQuery('(min-width:769px)').name, 'desktop');
  assert.deepEqual(obj.getSegmentByMediaQuery('(min-width: 769px)').name, 'desktop');
  assert.deepEqual(obj.getSegmentByMediaQuery('( min-width: 769px )').name, 'desktop');
});

QUnit.test('Assert getSegmentByWindowWorks', function(assert) {
  var point = $(window).width();
  var segment = obj.getSegmentByWindow();
  assert.ok(segment.from <= point && point <= segment.to);
});

QUnit.test('Assert getSegmentByNameWorks', function(assert) {
  assert.deepEqual(obj.getSegmentByName('tiny').name, 'tiny');
  assert.deepEqual(obj.getSegmentByName('mobile').name, 'mobile');
  assert.deepEqual(obj.getSegmentByName('desktop').name, 'desktop');
});

QUnit.test('Assert getSegmentByPointWorks', function(assert) {
  assert.deepEqual(obj.getSegmentByPoint(-1), undefined);
  assert.deepEqual(obj.getSegmentByPoint(0).name, 'tiny');
  assert.deepEqual(obj.getSegmentByPoint(100).name, 'tiny');
  assert.deepEqual(obj.getSegmentByPoint(240).name, 'tiny');
  assert.deepEqual(obj.getSegmentByPoint(241).name, 'mobile');
  assert.deepEqual(obj.getSegmentByPoint(500).name, 'mobile');
  assert.deepEqual(obj.getSegmentByPoint(768).name, 'mobile');
  assert.deepEqual(obj.getSegmentByPoint(769).name, 'desktop');
  assert.deepEqual(obj.getSegmentByPoint(1080).name, 'desktop');
  assert.deepEqual(obj.getSegmentByPoint(Infinity).name, 'desktop');
});

QUnit.test('Assert a breakpoint of 0 throws', function(assert) {
  assert.throws(function() {
    new BreakpointX({ 'screen': 0 });
  });
});


QUnit.test('test query method', function(assert) {
  var bp = new BreakpointX({
    'small': 480,
    'mobile': 768,
    'desktop': Infinity
  });
  assert.strictEqual(bp.query('small'), '(max-width:479px)');
  assert.strictEqual(bp.query('mobile'), '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.query('desktop'), '(min-width:768px)');
});

QUnit.test('Assert named aliases appear as obj.segmentNames.', function(assert) {
  var bp = new BreakpointX({ 'mobile': 768, 'desktop': Infinity });
  assert.strictEqual('mobile', bp.segmentNames[0]);
  assert.strictEqual('desktop', bp.segmentNames[1]);
});

QUnit.test('Assert named aliases appear as obj.aliases.', function(assert) {
  var bp = new BreakpointX({ 'mobile': 768, 'desktop': Infinity });
  assert.strictEqual('mobile', bp.aliases[0]);
  assert.strictEqual('desktop', bp.aliases[1]);
});

QUnit.test('Assert classes are not added to the html tag when options set.', function(assert) {
  new BreakpointX({ 'desktop': Infinity });
  assert.notOk($('html').hasClass('bpx-desktop'));
});

QUnit.test('Assert instantiation without callbacks still shows this.current and this.last.', function(assert) {
  var bp = new BreakpointX({ 'mainWindow': Infinity });
  assert.strictEqual(bp.current, 'mainWindow');
  assert.deepEqual(bp.last, {
    'alias': 'mainWindow',
    'direction': null,
    'width': [0, null]
  });
});

QUnit.test('Assert instantiation without args throws error.', function(assert) {
  assert.throws(function() {
    var bp = new BreakpointX();
  });
});

QUnit.test('Assert breakpoints out of order are put into asc order.', function(assert) {
  var outOfOrder = {
    desktop: Infinity,
    mobile: 769,
    tiny: 320,
  };
  var bp = new BreakpointX(outOfOrder);
  var result = [];
  for (var breakpoint in bp.breakpoints) {
    result.push(bp.breakpoints[breakpoint]);
  }

  assert.deepEqual(result, [[0, 319], [320, 768], [769, null]]);
  assert.deepEqual(bp.aliases, ['tiny', 'mobile', 'desktop']);
});

QUnit.test('Assert two breakpoints with string values works.',
  function(assert) {
    var bp = new BreakpointX({ 'mobile': '769px', 'desktop': Infinity });
    assert.strictEqual(bp.alias(320), 'mobile');
    assert.strictEqual(bp.alias(768), 'mobile');
    assert.strictEqual(bp.alias(769), 'desktop');
    assert.strictEqual(bp.alias(1024), 'desktop');
    assert.strictEqual(bp.alias(1600), 'desktop');
    assert.strictEqual(bp.alias(0), 'mobile');
  });

QUnit.test('Assert alias method works.', function(assert) {
  console.log(obj.segments);
  assert.strictEqual(obj.alias(769), 'desktop');
  assert.strictEqual(obj.alias(240), 'tiny');
  assert.strictEqual(obj.alias(768), 'mobile');
  assert.strictEqual(obj.alias(321), 'mobile');
  assert.strictEqual(obj.alias(320), 'mobile');
  assert.strictEqual(obj.alias(700), 'mobile');
  assert.strictEqual(obj.alias(1280), 'desktop');
  assert.strictEqual(obj.alias(1600), 'desktop');
  assert.strictEqual(obj.alias(1601), 'desktop');
});

QUnit.test('Assert two breakpoints alias works.', function(assert) {
  var bp = new BreakpointX({ 'mobile': 769, 'desktop': Infinity });

  assert.strictEqual(bp.alias(320), 'mobile');
  assert.strictEqual(bp.alias(768), 'mobile');
  assert.strictEqual(bp.alias(769), 'desktop');
  assert.strictEqual(bp.alias(1024), 'desktop');
  assert.strictEqual(bp.alias(1600), 'desktop');
  assert.strictEqual(bp.alias(0), 'mobile');
});

QUnit.test('Assert non-function to add() throws error.', function(assert) {
  assert.throws(function() {
    obj.add('both', ['tiny'], 'tree');
  });
});

QUnit.test('Assert empty breakpoints to add() throws error.', function(assert) {
  assert.throws(function() {
    obj.add('both', [], function() {
      var called = true;
    });
  });
});

QUnit.test('Assert bad direction to add() throws error.', function(assert) {
  assert.throws(function() {
    obj.add('hungry', ['tiny'], function() {
      var called = true;
    });
  });
});

QUnit.test('Assert add \'both\' works.', function(assert) {
  assert.strictEqual(obj.actions.both.length, 0);
  obj.add('both', ['tiny'], function() {
    called = true;
  });
  assert.strictEqual(obj.actions.both.tiny.length, 1);
});

QUnit.test('Assert add \'bigger\' works.', function(assert) {
  assert.strictEqual(obj.actions.bigger.length, 0);
  obj.add('bigger', ['tiny'], function() {
    called = true;
  });
  assert.strictEqual(obj.actions.bigger.tiny.length, 1);
});

QUnit.test('Assert add \'smaller\' works.', function(assert) {
  assert.strictEqual(obj.actions.smaller.length, 0);
  obj.add('smaller', ['tiny'], function() {
    called = true;
  });
  assert.strictEqual(obj.actions.smaller.tiny.length, 1);
});

QUnit.test('Assert value method works.', function(assert) {
  assert.deepEqual(obj.value('tiny'), [0, 240]);
  assert.deepEqual(obj.value('mobile'), [241, 768]);
  assert.deepEqual(obj.value('desktop'), [769, null]);
});

QUnit.test('imageWidthForRayComputesBasedOnSettingsValue', function(assert) {
  obj = new BreakpointX(breakpoints, {
    breakpointRayImageWidthRatio: 1.5
  });
  var segment = obj.getSegmentByName('desktop');
  assert.equal(segment.imageWidth, 1153);
});

QUnit.test('getSegmentByNameForTiny', function(assert) {
  var segment = obj.getSegmentByName('tiny');
  assert.deepEqual(segment.type, 'segment');
  assert.deepEqual(segment.name, 'tiny');
  assert.deepEqual(segment.from, 0);
  assert.deepEqual(segment.to, 241);
  assert.deepEqual(segment.breakpoint, 241);
  assert.deepEqual(segment.pixelWidth, 240);
  assert.deepEqual(segment.imageWidth, 240);
  assert.deepEqual(segment['@media'], '(max-width:240px)');
});

QUnit.test('getSegmentByNameForDesktop', function(assert) {
  var segment = obj.getSegmentByName('desktop');
  assert.deepEqual(segment.type, 'ray');
  assert.deepEqual(segment.name, 'desktop');
  assert.deepEqual(segment.from, 769);
  assert.deepEqual(segment.to, Infinity);
  assert.deepEqual(segment.breakpoint, undefined, 'segment.breakpoint is undefined');
  assert.deepEqual(segment.pixelWidth, Infinity);
  assert.ok(segment.imageWidth > segment.from);
  assert.deepEqual(segment['@media'], '(min-width:769px)');
});

QUnit.test('getSegmentByNameForMobile', function(assert) {
  var segment = obj.getSegmentByName('mobile');
  assert.deepEqual(segment.type, 'segment');
  assert.deepEqual(segment.name, 'mobile');
  assert.deepEqual(segment.from, 241);
  assert.deepEqual(segment.to, 769);
  assert.deepEqual(segment.breakpoint, 769);
  assert.deepEqual(segment.pixelWidth, 768);
  assert.deepEqual(segment.imageWidth, 768);
  assert.deepEqual(segment['@media'], '(min-width:241px) and (max-width:768px)');
});

QUnit.test('Able to instantiate and find version.', function(assert) {
  var breakpointX = new BreakpointX(breakpoints);
  assert.ok(breakpointX instanceof BreakpointX, 'Instantiated object is an instance of BreakpointX.');
  assert.ok(breakpointX.version, 'Version is not empty.');
});

//
//
// Per test setup
//
QUnit.testStart(function(details) {
  // Create a new DOM element #test, cloned from #template.
  $('#test').replaceWith(QUnit.storage.$template.clone().attr('id', 'test'));

  // Create a new breakpointX to be used in each test.
  obj = new BreakpointX(breakpoints);
});

QUnit.testDone(function() {
  // Reset out class prototype, which may have been altered in a test.
  BreakpointX.prototype = QUnit.storage.prototype;

  // Reset the html classes per the default.
  $('html').attr('class', QUnit.storage.htmlClass);
});

// Callback fires before all tests.
QUnit.begin(function() {
  QUnit.storage.htmlClass = $('html').attr('class') || '';
  QUnit.storage.prototype = $.extend({}, BreakpointX.prototype);
  QUnit.storage.$template = $('#template').clone();
  $('#template').replaceWith(QUnit.storage.$template.clone().attr('id', 'test'));
});

// Callback fires after all tests.
QUnit.done(function() {
  $('#test').replaceWith(QUnit.storage.$template);
});
