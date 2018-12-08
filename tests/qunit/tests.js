/**
 * @file
 * Tests provided against the BreakpointX class.
 *
 * @ingroup breakpointX
 * @{
 */
QUnit.storage = {};
var BreakpointX = BreakpointX || {};
var obj = {};
var objArgs = {
  breakpoints: [241, 769],
  segmentNames: ['tiny', 'mobile', 'desktop'],
};

QUnit.test('Callback arguments are correct on cross', function(assert) {
  var obj= new BreakpointX([300, 600], ['small', 'medium', 'large']);
  obj.addBreakpointCrossActionIncreasingOnly(600, function(segment, direction, breakpoint, pSegment) {
    assert.strictEqual(segment.name, 'large');
    assert.strictEqual(direction, 'bigger');
    assert.strictEqual(breakpoint, 600);
    assert.strictEqual(pSegment.name, 'small');
  })
    .triggerActions(200)
    .onWindowResize(700);
});

QUnit.test('Callback arguments are correct on init', function(assert) {
  var obj= new BreakpointX([500], ['small', 'large']);
  obj.addCrossAction(function(segment, direction, breakpoint, pSegment) {
    assert.strictEqual(segment.name, 'small');
    assert.strictEqual(direction, undefined);
    assert.strictEqual(breakpoint, null);
    assert.strictEqual(pSegment.name, null);
  })
    .triggerActions(400);
});

QUnit.test('We dont have double trigger onload at 479; based on demo.', function(assert) {
  var callCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['mobile', 'iphone', 'ipad-portrait', 'ipad-landscape'], {
    addClassesTo: 'html'
  });
  bpx
    .addCrossAction(function(segment, direction, breakpoint, from) {
      callCount++
    })
    .triggerActions(479);
  assert.strictEqual(callCount, 1);
});

QUnit.test('We dont have double trigger onload at 1024; based on demo.', function(assert) {
  var callCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['mobile', 'iphone', 'ipad-portrait', 'ipad-landscape'], {
    addClassesTo: 'html'
  });
  bpx
    .addCrossAction(function(to, direction, breakpoint, from) {
      callCount++
    })
    .triggerActions(1024);
  assert.strictEqual(callCount, 1);
});

QUnit.test('We dont have double trigger onload at 1023; based on demo.', function(assert) {
  var callCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['mobile', 'iphone', 'ipad-portrait', 'ipad-landscape'], {
    addClassesTo: 'html'
  });
  bpx
    .addCrossAction(function(to, direction, breakpoint, from) {
      callCount++
    })
    .triggerActions(1023);
  assert.strictEqual(callCount, 1);
});

QUnit.test('We dont have double trigger onload at 480; based on demo.', function(assert) {
  var callCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['mobile', 'iphone', 'ipad-portrait', 'ipad-landscape'], {
    addClassesTo: 'html'
  });
  bpx
    .addCrossAction(function(to, direction, breakpoint, from) {
      callCount++
    })
    .triggerActions(480);
  assert.strictEqual(callCount, 1);
});

QUnit.test('We dont have double trigger onload at 768; based on demo.', function(assert) {
  var callCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['mobile', 'iphone', 'ipad-portrait', 'ipad-landscape'], {
    addClassesTo: 'html'
  });
  bpx
    .addCrossAction(function(to, direction, breakpoint, from) {
      callCount++
    })
    .triggerActions(768);
  assert.strictEqual(callCount, 1);
});

QUnit.test('Assert we trigger two breakpoint callbacks when jumping over both.', function(assert) {
  var bp1CallCount = 0;
  var bp2CallCount = 0;
  var obj = new BreakpointX([400, 800]);
  obj.addBreakpointCrossAction(400, function() {
    bp1CallCount++;
  }).addBreakpointCrossAction(800, function() {
    bp2CallCount++;
  })
    .triggerActions(0);
  assert.strictEqual(bp1CallCount, 1);
  assert.strictEqual(bp2CallCount, 0);

  obj.onWindowResize(1000);
  assert.strictEqual(bp1CallCount, 2);
  assert.strictEqual(bp2CallCount, 1);

  obj.onWindowResize(1);
  assert.strictEqual(bp1CallCount, 3);
  assert.strictEqual(bp2CallCount, 2);
});

QUnit.test('Make sure we trigger cross when quickly jumping over two breakpoints', function(assert) {
  var calledCount = 0;
  var bpx = new BreakpointX([500, 900], ['small', 'medium', 'large'], {
    addClassesTo: 'html'
  });
  bpx.addBreakpointCrossAction(900, function(segment, breakpoint, direction, pSegment) {
    calledCount++;
  })
    .triggerActions(960)
    .onWindowResize(100);
  assert.strictEqual(calledCount, 2);
});

QUnit.test('Make sure the middle css class does not remain if we go quickly from large to small', function(assert) {
  var obj = new BreakpointX([500, 900], ['small', 'medium', 'large'], {
    addClassesTo: 'html'
  });
  obj
    .onWindowResize(200)
    .onWindowResize(700)
    .onWindowResize(1000);
  assert.strictEqual($('html').attr('class'), 'bpx-large bpx-bigger');

  obj.onWindowResize(200);
  assert.strictEqual($('html').attr('class'), 'bpx-small bpx-smaller');
});


QUnit.test('May not register an action to a non-breakpoint.', function(assert) {
  assert.throws(function() {
    var b = new BreakpointX([768]);
    b.addBreakpointCrossAction('bogus');
  });
});

QUnit.test('May not register an action to an unregistered breakpoint.', function(assert) {
  assert.throws(function() {
    var b = new BreakpointX([768]);
    b.addBreakpointCrossAction(223);
  });
});

QUnit.test('Providing integer to constructor throws', function(assert) {
  assert.throws(function() {
    new BreakpointX(768, 1080);
  });
});

QUnit.test('Assert .breakpoints is populated and sorted.', function(assert) {
  assert.deepEqual(obj.breakpoints, [241, 769]);

  obj = new BreakpointX([400, 100, 1080, 52]);
  assert.deepEqual(obj.breakpoints, [52, 100, 400, 1080]);
});

QUnit.test('Assert getSegmentWorks', function(assert) {
  assert.deepEqual(obj.getSegment(0).name, 'tiny');
  assert.deepEqual(obj.getSegment(10).name, 'tiny');
  assert.deepEqual(obj.getSegment('tiny').name, 'tiny');
  assert.deepEqual(obj.getSegment('(max-width:240px)').name, 'tiny');
  assert.deepEqual(obj.getSegment('(max-width:240)').name, null);
  assert.deepEqual(obj.getSegment('bogus').name, null);
  assert.deepEqual(obj.getSegment(-1).name, null);
});

QUnit.test('Assert getSegment works with bad number', function(assert) {
  assert.deepEqual(obj.getSegment(-1).name, null);
});


QUnit.test('Assert classes are added to the html tag when options set.',
  function(assert) {
    assert.notOk($('html').hasClass('bpx-website'));
    new
    BreakpointX([obj.getWindowWidth() - 1], ['small', 'website'], { addClassesTo: 'html' });
    assert.ok($('html').hasClass('bpx-website'));
  });

QUnit.test('Assert getBreakpointRay works', function(assert) {
  assert.strictEqual(obj.getBreakpointRay().name, 'desktop');

  obj = new BreakpointX([480, 768, 1080]);
  assert.strictEqual(obj.getBreakpointRay().name, '1080-Infinity');
});

QUnit.test('Assert that breakpoints as an array of values works.', function(assert) {
  var bp = new BreakpointX([480, 768, 1080]);
  assert.deepEqual(bp.segmentNames, [
    '0-479',
    '480-767',
    '768-1079',
    '1080-Infinity',
  ]);
  assert.strictEqual(bp.getSegment(0)['@media'], '(max-width:479px)');
  assert.strictEqual(bp.getSegment(100)['@media'], '(max-width:479px)');
  assert.strictEqual(bp.getSegment(320)['@media'], '(max-width:479px)');
  assert.strictEqual(bp.getSegment(479)['@media'], '(max-width:479px)');

  assert.strictEqual(bp.getSegment(480)['@media'], '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.getSegment(500)['@media'], '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.getSegment(600)['@media'], '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.getSegment(767)['@media'], '(min-width:480px) and (max-width:767px)');

  assert.strictEqual(bp.getSegment(768)['@media'], '(min-width:768px) and (max-width:1079px)');

  assert.strictEqual(bp.getSegment(1080)['@media'], '(min-width:1080px)');
  assert.strictEqual(bp.getSegment(2560)['@media'], '(min-width:1080px)');
});

QUnit.test('Assert getSegmentWorks', function(assert) {
  assert.deepEqual(obj.getSegment('(max-width:240px)').name, 'tiny');
  assert.deepEqual(obj.getSegment('(max-width: 240px)').name, 'tiny');
  assert.deepEqual(obj.getSegment('( max-width: 240px )').name, 'tiny');
  assert.deepEqual(obj.getSegment('(min-width:241px) and (max-width:768px)').name, 'mobile');
  assert.deepEqual(obj.getSegment('(min-width:241px)and(max-width:768px)').name, 'mobile');
  assert.deepEqual(obj.getSegment(' (min-width:241px) and (max-width: 768px)').name, 'mobile');
  assert.deepEqual(obj.getSegment('(min-width:769px)').name, 'desktop');
  assert.deepEqual(obj.getSegment('(min-width: 769px)').name, 'desktop');
  assert.deepEqual(obj.getSegment('( min-width: 769px )').name, 'desktop');
});

QUnit.test('Assert getSegmentByWindowWorks', function(assert) {
  var point = $(window).width();
  var segment = obj.getSegmentByWindow();
  assert.ok(segment.from <= point && point <= segment.to);
});

QUnit.test('Assert getSegment using name works', function(assert) {
  assert.deepEqual(obj.getSegment('tiny').name, 'tiny');
  assert.deepEqual(obj.getSegment('mobile').name, 'mobile');
  assert.deepEqual(obj.getSegment('desktop').name, 'desktop');
});

QUnit.test('Assert getSegmentWorks using point', function(assert) {
  assert.deepEqual(obj.getSegment(Infinity).name, 'desktop');
  assert.deepEqual(obj.getSegment(-1).name, null);
  assert.deepEqual(obj.getSegment(0).name, 'tiny');
  assert.deepEqual(obj.getSegment(100).name, 'tiny');
  assert.deepEqual(obj.getSegment(240).name, 'tiny');
  assert.deepEqual(obj.getSegment(241).name, 'mobile');
  assert.deepEqual(obj.getSegment(500).name, 'mobile');
  assert.deepEqual(obj.getSegment(768).name, 'mobile');
  assert.deepEqual(obj.getSegment(769).name, 'desktop');
  assert.deepEqual(obj.getSegment(1080).name, 'desktop');
});

QUnit.test('Assert a breakpoint of 0 throws', function(assert) {
  assert.throws(function() {
    new BreakpointX([0]);
  });
});

QUnit.test('test the @media property on the getSegment method.', function(assert) {
  var bp = new BreakpointX([480, 768], ['small', 'mobile', 'desktop']);
  assert.strictEqual(bp.getSegment(-1)['@media'], null);
  assert.strictEqual(bp.getSegment('small')['@media'], '(max-width:479px)');
  assert.strictEqual(bp.getSegment('mobile')['@media'], '(min-width:480px) and (max-width:767px)');
  assert.strictEqual(bp.getSegment('desktop')['@media'], '(min-width:768px)');
});

QUnit.test('Assert named aliases appear as obj.segmentNames.', function(assert) {
  var bp = new BreakpointX([768], ['mobile', 'desktop']);
  assert.strictEqual('mobile', bp.segmentNames[0]);
  assert.strictEqual('desktop', bp.segmentNames[1]);
});

QUnit.test('Assert named aliases appear as obj.segmentNames.', function(assert) {
  var bp = new BreakpointX([768], ['mobile', 'desktop']);
  assert.strictEqual('mobile', bp.segmentNames[0]);
  assert.strictEqual('desktop', bp.segmentNames[1]);
});

QUnit.test('Assert classes are not added to the html tag when addClassesTo is not set.',
  function(assert) {
    new BreakpointX([obj.getWindowWidth() - 1], ['small', 'large']);
    assert.notOk($('html').hasClass('bpx-website'));
  });

QUnit.test('Assert instantiation without args throws error.', function(assert) {
  assert.throws(function() {
    var bp = new BreakpointX();
  });
});

QUnit.test('Assert breakpoints out of order are put into asc order.', function(assert) {
  var bp = new BreakpointX([769, 320], ['tiny', 'mobile', 'desktop']);
  var result = [];
  for (var i in bp.segmentNames) {
    result.push(bp.getSegment(bp.segmentNames[i]));
  }
  assert.strictEqual(result[0].from, 0);
  assert.strictEqual(result[1].from, 320);
  assert.strictEqual(result[2].from, 769);
  assert.deepEqual(bp.segmentNames, ['tiny', 'mobile', 'desktop']);
});

QUnit.test('Assert two breakpoints with string values works.',
  function(assert) {
    var bp = new BreakpointX(['769px'], ['mobile', 'desktop']);
    assert.strictEqual(bp.getSegment(320).name, 'mobile');
    assert.strictEqual(bp.getSegment(768).name, 'mobile');
    assert.strictEqual(bp.getSegment(769).name, 'desktop');
    assert.strictEqual(bp.getSegment(1024).name, 'desktop');
    assert.strictEqual(bp.getSegment(1600).name, 'desktop');
    assert.strictEqual(bp.getSegment(0).name, 'mobile');
  });

QUnit.test('Assert getSegment method works.name.', function(assert) {
  assert.strictEqual(obj.getSegment(769).name, 'desktop');
  assert.strictEqual(obj.getSegment(240).name, 'tiny');
  assert.strictEqual(obj.getSegment(768).name, 'mobile');
  assert.strictEqual(obj.getSegment(321).name, 'mobile');
  assert.strictEqual(obj.getSegment(320).name, 'mobile');
  assert.strictEqual(obj.getSegment(700).name, 'mobile');
  assert.strictEqual(obj.getSegment(1280).name, 'desktop');
  assert.strictEqual(obj.getSegment(1600).name, 'desktop');
  assert.strictEqual(obj.getSegment(1601).name, 'desktop');
});

QUnit.test('Assert two breakpoints alias works.', function(assert) {
  var bp = new BreakpointX([769], ['mobile', 'desktop']);
  assert.strictEqual(bp.getSegment(769).name, 'desktop');
  assert.strictEqual(bp.getSegment(1024).name, 'desktop');
  assert.strictEqual(bp.getSegment(1600).name, 'desktop');
  assert.strictEqual(bp.getSegment(320).name, 'mobile');
  assert.strictEqual(bp.getSegment(768).name, 'mobile');
  assert.strictEqual(bp.getSegment(0).name, 'mobile');
});

QUnit.test('Assert non-function when adding action throws error.', function(assert) {
  assert.throws(function() {
    obj.addAction('both', ['tiny'], 'tree');
  });
});

QUnit.test('Assert empty breakpoints when adding action throws error.', function(assert) {
  assert.throws(function() {
    obj.addAction('both', [], function() {
      var called = true;
    });
  });
});

QUnit.test('Assert bad direction when adding action throws error.', function(assert) {
  assert.throws(function() {
    obj.addAction('hungry', ['tiny'], function() {
      var called = true;
    });
  });
});

QUnit.test('Assert classes are added to the html tag for each segment using triggerActions.', function(assert) {
  var obj = new BreakpointX([480, 768], ['mobile', 'iphone', 'ipad-portrait'], {
    addClassesTo: 'html'
  });
  obj.triggerActions(0);
  assert.ok($('html').hasClass('bpx-mobile'));
  obj.triggerActions(200);
  assert.ok($('html').hasClass('bpx-mobile'));
  obj.triggerActions(479);
  assert.ok($('html').hasClass('bpx-mobile'));
  obj.triggerActions(480);
  assert.ok($('html').hasClass('bpx-iphone'));
  obj.triggerActions(527);
  assert.ok($('html').hasClass('bpx-iphone'));
  obj.triggerActions(767);
  assert.ok($('html').hasClass('bpx-iphone'));
  obj.triggerActions(768);
  assert.ok($('html').hasClass('bpx-ipad-portrait'));
  obj.triggerActions(1024);
  assert.ok($('html').hasClass('bpx-ipad-portrait'));
  obj.triggerActions(Infinity);
  assert.ok($('html').hasClass('bpx-ipad-portrait'));
});

QUnit.test('Assert reset clears actions', function(assert) {
  var calledCount = 0;
  obj.addCrossAction(function() {
    calledCount++;
  }).triggerActions();
  obj.reset();
  obj.triggerActions();
  assert.strictEqual(calledCount, 1);
});

QUnit.test('Test action added with addBreakpointCrossAction fires the callbacks as expected on window width change.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossAction(480, function() {
      calledCount++;
    });
  assert.strictEqual(calledCount, 0);
  obj
    .onWindowResize(200);
  assert.strictEqual(calledCount, 1);
  obj
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 3);
});

QUnit.test('Test action added with addBreakpointCrossActionIncreasingOnly fires the callbacks as expected on window width change using triggerActions.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossActionIncreasingOnly(480, function() {
      calledCount++;
    })
    .triggerActions(200);
  assert.strictEqual(calledCount, 0);
  obj
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 1);
});

QUnit.test('Test action added with addBreakpointCrossActionIncreasingOnly fires the callbacks as expected on window width change using triggerActions.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossActionIncreasingOnly(480, function() {
      calledCount++;
    })
    .triggerActions(700);
  assert.strictEqual(calledCount, 1);
  obj
    .onWindowResize(200)
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 2);
});


QUnit.test('Test action added with addBreakpointCrossActionDecreasingOnly fires the callbacks as expected on window width change using triggerActions.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossActionDecreasingOnly(480, function() {
      calledCount++;
    })
    .triggerActions(200);
  assert.strictEqual(calledCount, 1);
  obj
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 2);
});

QUnit.test('Test action added with addBreakpointCrossActionDecreasingOnly fires the callbacks as expected on window width change using triggerActions.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossActionDecreasingOnly(480, function() {
      calledCount++;
    })
    .triggerActions(700);
  assert.strictEqual(calledCount, 0);
  obj
    .onWindowResize(200)
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 2);
});

QUnit.test('Test action added with addBreakpointCrossAction fires the callbacks as expected on window width change using triggerActions.', function(assert) {
  var calledCount = 0;
  var obj = new BreakpointX([480, 768, 1024]);
  obj
    .addBreakpointCrossAction(480, function() {
      calledCount++;
    })
    .triggerActions(200);
  assert.strictEqual(calledCount, 1);
  obj
    .onWindowResize(500)
    .onWindowResize(200);
  assert.strictEqual(calledCount, 3);
});

QUnit.test('Test addBreakpointCrossAction', function(assert) {
  var calledCount = 0;
  var bpx = new BreakpointX([480, 768, 1024]);
  bpx
    .addBreakpointCrossAction(768, function(a, b, c, d) {
      calledCount++;
    })
    .triggerActions(700);
  assert.strictEqual(calledCount, 1);
  bpx
    .onWindowResize(900)
    .onWindowResize(900)
    .onWindowResize(700);
  assert.strictEqual(calledCount, 3);
  bpx
    .onWindowResize(1200)
    .onWindowResize(1500);

  assert.strictEqual(calledCount, 4);
});

QUnit.test('Test addBreakpointCrossAction', function(assert) {
  var calledCount = 0;
  var bpx = new BreakpointX([480, 768, 1024], ['a', 'b', 'c', 'd']);
  bpx
    .addBreakpointCrossAction(1024, function() {
      calledCount++;
    });
  bpx
    .triggerActions(200)
    .onWindowResize(500)
    .onWindowResize(900)
    .onWindowResize(1200)
    .onWindowResize(1000)
    .onWindowResize(900)
    .onWindowResize(700)
    .onWindowResize(479)
    .onWindowResize(1200)
    .onWindowResize(20);
  assert.strictEqual(calledCount, 4);
});

QUnit.test('imageWidthForRayComputesBasedOnSettingsValue with no named segment.', function(assert) {
  obj = new BreakpointX([768], {
    breakpointRayImageWidthRatio: 1.5
  });
  var segment = obj.getSegment('768-Infinity');
  assert.equal(segment.imageWidth, 1075);
});

QUnit.test('imageWidthForRayComputesBasedOnSettingsValue', function(assert) {
  obj = new BreakpointX(objArgs.breakpoints, objArgs.segmentNames, {
    breakpointRayImageWidthRatio: 1.5
  });
  var segment = obj.getSegment('desktop');
  assert.equal(segment.imageWidth, 1153);
});

QUnit.test('getSegmentForTiny', function(assert) {
  var segment = obj.getSegment('tiny');
  assert.deepEqual(segment.type, 'segment');
  assert.deepEqual(segment.name, 'tiny');
  assert.deepEqual(segment.from, 0);
  assert.deepEqual(segment.to, 240);
  assert.deepEqual(segment.pixelWidth, 240);
  assert.deepEqual(segment.imageWidth, 240);
  assert.deepEqual(segment['@media'], '(max-width:240px)');
});

QUnit.test('getSegmentForDesktop', function(assert) {
  var segment = obj.getSegment('desktop');
  assert.deepEqual(segment.type, 'ray');
  assert.deepEqual(segment.name, 'desktop');
  assert.deepEqual(segment.from, 769);
  assert.deepEqual(segment.to, Infinity);
  assert.deepEqual(segment.pixelWidth, Infinity);
  assert.ok(segment.imageWidth > segment.from);
  assert.deepEqual(segment['@media'], '(min-width:769px)');
});

QUnit.test('getSegmentForMobile', function(assert) {
  var segment = obj.getSegment('mobile');
  assert.deepEqual(segment.type, 'segment');
  assert.deepEqual(segment.name, 'mobile');
  assert.deepEqual(segment.from, 241);
  assert.deepEqual(segment.to, 768);
  assert.deepEqual(segment.pixelWidth, 768);
  assert.deepEqual(segment.imageWidth, 768);
  assert.deepEqual(segment['@media'], '(min-width:241px) and (max-width:768px)');
});

QUnit.test('Able to instantiate and find version.', function(assert) {
  var breakpointX = new BreakpointX(objArgs.breakpoints);
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
  obj = new BreakpointX(objArgs.breakpoints, objArgs.segmentNames);
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
