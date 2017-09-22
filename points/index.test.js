var boxography = require('./'),
    LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER,
    b = require('@timelaps/batterie'),
    layout = require('@specless/layout');
b.describe('points', function () {
    b.it('handles regular boxes', function (t) {
        var min = 30;
        t.expect(boxography([{
            width: [300],
            height: [300]
        }]).bounds).toEqual([
            [{
                x: min,
                y: min
            }, {
                x: LARGE_INTEGER,
                y: min
            }, {
                x: LARGE_INTEGER,
                y: LARGE_INTEGER
            }, {
                x: min,
                y: LARGE_INTEGER
            }]
        ]);
    });
    b.it('can cut off the min and max dimensions', function (t) {
        var min = 100;
        var max = 600;
        t.expect(boxography([{
            width: 300,
            height: 300,
            minWidth: min,
            minHeight: min,
            maxWidth: max,
            maxHeight: max
        }]).bounds).toEqual([
            [{
                x: min,
                y: min
            }, {
                x: max,
                y: min
            }, {
                x: max,
                y: max
            }, {
                x: min,
                y: max
            }]
        ]);
    });
    b.it('can cut off the min and max corner to make a triangle', function (t) {
        var min = 30;
        var minAspect = 2;
        t.expect(boxography([{
            width: 300,
            height: 300,
            minAspect: minAspect
        }]).bounds).toEqual([
            [{
                x: min * minAspect,
                y: min
            }, {
                x: LARGE_INTEGER,
                y: min
            }, {
                x: LARGE_INTEGER,
                y: LARGE_INTEGER / minAspect
            }]
        ]);
    });
    b.it('can cut off the max corner to make a polygon', function (t) {
        var minX = 30;
        var minY = 10;
        var minAspect = 2;
        var MAX_WIDTH = 1000;
        t.expect(boxography([{
            width: 300,
            height: 100,
            maxWidth: MAX_WIDTH,
            minAspect: minAspect
        }]).bounds).toEqual([
            [{
                x: minX,
                y: minY
            }, {
                x: MAX_WIDTH,
                y: minY
            }, {
                x: MAX_WIDTH,
                y: MAX_WIDTH / minAspect
            }, {
                x: minX,
                y: minX / minAspect
            }]
        ]);
    });
    b.it('can cut off the min corner to make a polygon', function (t) {
        var minX = 10;
        var minY = 30;
        var minAspect = 2;
        var MAX_HEIGHT = 1000;
        t.expect(boxography([{
            width: 100,
            height: 300,
            maxHeight: MAX_HEIGHT,
            minAspect: minAspect
        }]).bounds).toEqual([
            [{
                x: minY * minAspect,
                y: minY
            }, {
                x: LARGE_INTEGER,
                y: minY
            }, {
                x: LARGE_INTEGER,
                y: MAX_HEIGHT
            }, {
                x: MAX_HEIGHT / minAspect,
                y: MAX_HEIGHT
            }]
        ]);
    });
});