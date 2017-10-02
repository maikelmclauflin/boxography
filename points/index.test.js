var boxography = require('./'),
    LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER,
    b = require('@timelaps/batterie'),
    layout = require('@specless/layout'),
    createLayout = require('@specless/layout/create'),
    bounds = require('../bounds/from-coords'),
    intersection = require('../intersection'),
    loss = require('../loss');
b.describe('points', function () {
    b.it('handles regular boxes', function (t) {
        var min = 30;
        t.expect(boxography([{
            id: 'one',
            width: [300],
            height: [300]
        }]).one.bounds).toEqual(bounds(30, 30));
    });
    b.it('can cut off the min and max dimensions', function (t) {
        var min = 100;
        var max = 600;
        t.expect(boxography([{
            id: 'one',
            width: 300,
            height: 300,
            minWidth: min,
            minHeight: min,
            maxWidth: max,
            maxHeight: max
        }]).one.bounds).toEqual(bounds(min, min, max, max));
    });
    b.describe('max-aspect', function () {
        b.it('will not have any losses when', function (t) {
            var min = 30;
            var result = boxography([{
                id: 'one',
                width: 100,
                height: 100,
                maxAspect: Infinity
            }]);
            t.expect(result.one.losses).toBeEmptyArray();
        });
        b.describe('can cut off the top-right corner', function () {
            b.it('when the aspect is above 1', function (t) {
                var min = 30;
                var maxAspect = 2;
                var result = boxography([{
                    id: 'one',
                    width: min * 10,
                    height: min * 10,
                    maxAspect: maxAspect
                }]);
                var one = result.one;
                t.expect(one.losses).toEqual([
                    loss({
                        top: true,
                        aspect: maxAspect,
                        minX: min,
                        minY: min
                    })
                ]);
            });
            b.it('when the aspect is below 1', function (t) {
                var minWidth = 10;
                var minHeight = 20;
                var maxAspect = 0.8;
                var maxWidth = 500;
                var maxHeight = 1000;
                var result = boxography([{
                    id: 'one',
                    width: minWidth * 10,
                    height: minHeight * 10,
                    maxAspect: maxAspect,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight
                }]);
                var one = result.one;
                t.expect(one.losses).toEqual([
                    loss({
                        aspect: maxAspect,
                        maxX: maxWidth,
                        maxY: maxHeight,
                        minX: minWidth,
                        minY: minHeight,
                        top: true
                    })
                ]);
            });
        });
    });
    b.describe('min-aspect', function (t) {
        b.it('does nothing with a slope of 0', function (t) {
            var min = 1;
            var minAspect = 0;
            var result = boxography([{
                id: 'one',
                height: min * 10,
                width: min * 10,
                minAspect: minAspect
            }]);
            t.expect(result.one.losses).toEqual([]);
        });
        b.it('removes everything with a slope of infinity', function (t) {
            var min = 1;
            var minAspect = Infinity;
            var result = boxography([{
                id: 'one',
                height: min * 10,
                width: 1 * 10,
                minAspect: Infinity
            }]);
            t.expect(result.one.losses).toEqual([loss({
                aspect: Infinity
            })]);
        });
        b.it('removes items under', function (t) {
            var min = 30;
            var minAspect = 1;
            var result = boxography([{
                id: 'one',
                height: min * 10,
                width: min * 10,
                minAspect: 0.8
            }]);
            t.expect(result.one.losses).toEqual([loss({
                aspect: 0.8,
                minX: min,
                minY: min
            })]);
        });
    });
    b.describe('two layouts', function () {
        b.it('adds losses to both sides', function (t) {
            var one = {
                id: 'one',
                height: 300,
                width: 100
            };
            var two = {
                id: 'two',
                height: 100,
                width: 200
            };
            var result = boxography([one, two]);
            var layout1 = createLayout(one);
            var layout2 = createLayout(two);
            var intrsctn = intersection(layout1, layout2);
            var intersectionAspect = intrsctn.x / intrsctn.y;
            t.expect(result.one.losses).toEqual([loss({
                aspect: intersectionAspect,
                minX: two.width / 10,
                minY: two.height / 10,
                top: true
            })]);
            t.expect(result.two.losses).toEqual([loss({
                aspect: intersectionAspect,
                minX: one.width / 10,
                minY: one.height / 10
            })]);
        }, 2);
    });
});