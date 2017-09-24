var boxography = require('./'),
    LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER,
    b = require('@timelaps/batterie'),
    layout = require('@specless/layout'),
    rectangle = require('../rectangle'),
    triangle = require('../triangle');
// b.log(JSON.stringify(one.losses, null, 2));
// b.log(JSON.stringify([
//     rectangle(x1, y1, x3, y2),
//     triangle(x1, y2, x3, y3 / maxAspect, true)
// ], null, 2));
function basic(x, y, maxX, maxY) {
    return [{
        x: x,
        y: y
    }, {
        x: maxX || LARGE_INTEGER,
        y: y
    }, {
        x: maxX || LARGE_INTEGER,
        y: maxY || LARGE_INTEGER
    }, {
        x: x,
        y: maxY || LARGE_INTEGER
    }];
}
b.describe('points', function () {
    b.it('handles regular boxes', function (t) {
        var min = 30;
        t.expect(boxography([{
            id: 'one',
            width: [300],
            height: [300]
        }]).one.bounds).toEqual(basic(30, 30));
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
        }]).one.bounds).toEqual(basic(min, min, max, max));
    });
    b.describe('max-aspect', function () {
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
                    triangle(min * maxAspect, min, LARGE_INTEGER, LARGE_INTEGER / maxAspect, true)
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
                // b.log(JSON.stringify(one.losses, null, 2));
                t.expect(one.losses).toEqual([
                    triangle(minHeight / maxAspect, minHeight, maxWidth, maxWidth * maxAspect, true)
                ]);
            });
        });
        b.describe('can remove top-right and bottom-right corners', function () {
            b.it('when the aspect is below 1', function (t) {
                var minWidth = 30;
                var minHeight = 60;
                var maxAspect = 0.8;
                var maxWidth = 1000;
                var maxHeight = maxWidth;
                var result = boxography([{
                    id: 'one',
                    width: minWidth * 10,
                    height: minHeight * 10,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    maxAspect: maxAspect
                }]);
                var one = result.one;
                var x1 = minWidth;
                var y1 = minHeight;
                var x3 = maxWidth;
                var y3 = maxHeight;
                var x2 = maxHeight * maxAspect;
                t.expect(one.losses).toEqual([
                    rectangle(x2, y1, x3, y3),
                    triangle(y1 / maxAspect, y1, x2, y3, true)
                ]);
            });
            b.it('when the aspect is above 1', function (t) {
                var minWidth = 30;
                var minHeight = 60;
                var maxAspect = 1.2;
                var maxWidth = 1500;
                var maxHeight = 1000;
                var result = boxography([{
                    id: 'one',
                    width: minWidth * 10,
                    height: minHeight * 10,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    maxAspect: maxAspect
                }]);
                var one = result.one;
                var x1 = minWidth;
                var y1 = minHeight;
                var x3 = maxWidth;
                var y3 = maxHeight;
                var x2 = maxHeight * maxAspect;
                t.expect(one.losses).toEqual([
                    rectangle(x2, y1, x3, y3),
                    triangle(y1 * maxAspect, y1, x2, y3, true)
                ]);
            });
        });
        b.describe('can remove top-left and top-right corners', function () {
            b.it('when the aspect is over 1', function (t) {
                var minWidth = 70;
                var minHeight = 20;
                var maxAspect = 1.2;
                var maxWidth = 1000;
                var maxHeight = maxWidth;
                var result = boxography([{
                    id: 'one',
                    width: minWidth * 10,
                    height: minHeight * 10,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    maxAspect: maxAspect
                }]);
                var one = result.one;
                var x1 = minWidth;
                var y1 = minHeight;
                var x3 = maxWidth;
                var y3 = maxWidth;
                var y2 = minWidth * maxAspect;
                t.expect(one.losses).toEqual([
                    rectangle(x1, y1, x3, y2),
                    triangle(x1, y2, x3, y3 / maxAspect, true)
                ]);
            });
            b.it('when the aspect is under 1', function (t) {
                var minWidth = 30;
                var minHeight = 30;
                var maxAspect = 0.8;
                var maxWidth = 1000;
                var maxHeight = 2000;
                var result = boxography([{
                    id: 'one',
                    width: minWidth * 10,
                    height: minHeight * 10,
                    maxWidth: maxWidth,
                    maxHeight: maxHeight,
                    maxAspect: maxAspect
                }]);
                var one = result.one;
                var x1 = minWidth;
                var y1 = minHeight;
                var x3 = maxWidth;
                var y3 = maxHeight;
                var y2 = minWidth / maxAspect;
                t.expect(one.losses).toEqual([
                    rectangle(x1, y1, x3, y2),
                    triangle(x1, y2, x3, x3 / maxAspect, true)
                ]);
            });
        });
    });
    // b.it('can remove the top-right and bottom-right corners', function (t) {
    //     var minWidth = 80;
    //     var minHeight = 20;
    //     var maxAspect = 2;
    //     var maxWidth = minWidth * 100;
    //     var maxHeight = minHeight * 100;
    //     var result = boxography([{
    //         id: 'one',
    //         width: minWidth * 10,
    //         height: minHeight * 10,
    //         maxWidth: maxWidth,
    //         maxHeight: maxHeight
    //     }]);
    //     var one = result.one;
    //     t.expect(one.bounds).toEqual(basic(minWidth, minHeight, maxWidth, maxHeight));
    //     b.log(JSON.stringify(one.losses, null, 2));
    //     var x1 = minWidth;
    //     var y1 = minHeight;
    //     var x3 = maxWidth;
    //     var y3 = maxHeight;
    //     var x2 = y3 / maxAspect;
    //     t.expect(one.losses).toEqual([
    //         rectangle(x2, y1, x3, y3), //
    //         triangle(x1, y1, x2, y3)
    //     ]);
    // }, 2);
    // b.it('can remove the bottom-left corner to leave a pentagon', function (t) {
    //     var min = 30;
    //     var minAspect = 0.5;
    //     var result = boxography([{
    //         id: 'one',
    //         width: min * 10,
    //         height: min * 10,
    //         minAspect: minAspect
    //     }]);
    //     var one = result.one;
    //     b.log(JSON.stringify(one.losses, null, 2));
    //     t.expect(one.bounds).toEqual(basic(min, min));
    //     t.expect(one.losses).toEqual([
    //         [{
    //             x: min,
    //             y: min / minAspect
    //         }, {
    //             x: LARGE_INTEGER * minAspect,
    //             y: LARGE_INTEGER
    //         }, {
    //             x: min,
    //             y: LARGE_INTEGER
    //         }],
    //         []
    //     ]);
    // }, 2);
    // b.it('can cut off the min and max corner to make a triangle', function (t) {
    //     var min = 30;
    //     var minAspect = 2;
    //     var result = boxography([{
    //         id: 'one',
    //         width: 300,
    //         height: 300,
    //         minAspect: minAspect
    //     }]);
    //     t.expect(result.one.losses).toEqual([
    //         [{
    //             x: min,
    //             y: min
    //         }, {
    //             x: LARGE_INTEGER / minAspect,
    //             y: min
    //         }, {
    //             //
    //         }]
    //     ]);
    // });
    // b.it('can cut off the max corner to make a four pointed polygon', function (t) {
    //     var minX = 30;
    //     var minY = 10;
    //     var minAspect = 2;
    //     var MAX_WIDTH = 1000;
    //     t.expect(boxography([{
    //         width: 300,
    //         height: 100,
    //         maxWidth: MAX_WIDTH,
    //         minAspect: minAspect
    //     }]).bounds).toEqual([
    //         [{
    //             x: minX,
    //             y: minY
    //         }, {
    //             x: MAX_WIDTH,
    //             y: minY
    //         }, {
    //             x: MAX_WIDTH,
    //             y: MAX_WIDTH / minAspect
    //         }, {
    //             x: minX,
    //             y: minX / minAspect
    //         }]
    //     ]);
    // });
    // b.it('can cut off the min corner to make a four pointed polygon', function (t) {
    //     var minX = 10;
    //     var minY = 30;
    //     var minAspect = 1;
    //     var MAX_HEIGHT = 1000;
    //     // debugger;
    //     // b.log(JSON.stringify(boxography([{
    //     //     width: 100,
    //     //     height: 300,
    //     //     maxHeight: MAX_HEIGHT,
    //     //     minAspect: minAspect
    //     // }]).bounds, null, 2));
    //     t.expect(boxography([{
    //         width: 100,
    //         height: 300,
    //         maxHeight: MAX_HEIGHT,
    //         minAspect: minAspect
    //     }]).bounds).toEqual([
    //         [{
    //             x: minY * minAspect,
    //             y: minY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: minY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: MAX_HEIGHT
    //         }, {
    //             x: MAX_HEIGHT / minAspect,
    //             y: MAX_HEIGHT
    //         }]
    //     ]);
    // });
    // b.it('can cut off the top right corner to make a pentagon', function (t) {
    //     var maxAspect = 2;
    //     var width = 100;
    //     var height = 100;
    //     var minHeight = height / 10;
    //     var minWidth = width / 10;
    //     var maxHeight = 800;
    //     var maxWidth = 800;
    //     t.expect(boxography([{
    //         width: width,
    //         height: height,
    //         maxHeight: maxHeight,
    //         maxWidth: maxWidth,
    //         maxAspect: maxAspect
    //     }]).bounds).toEqual([
    //         [{
    //             x: minWidth,
    //             y: minHeight
    //         }, {
    //             x: minHeight * maxAspect,
    //             y: minHeight
    //         }, {
    //             x: maxWidth,
    //             y: maxWidth / maxAspect
    //         }, {
    //             x: maxWidth,
    //             y: maxHeight
    //         }, {
    //             x: minWidth,
    //             y: maxHeight
    //         }]
    //     ]);
    // });
    // b.it('can cut off the bottom left corner to make a pentagon', function (t) {
    //     var minAspect = 0.5;
    //     var width = 100;
    //     var height = 100;
    //     var minHeight = height / 10;
    //     var minWidth = width / 10;
    //     var maxHeight = 800;
    //     var maxWidth = 800;
    //     t.expect(boxography([{
    //         width: width,
    //         height: height,
    //         maxHeight: maxHeight,
    //         maxWidth: maxWidth,
    //         minAspect: minAspect
    //     }]).bounds).toEqual([
    //         [{
    //             x: minWidth,
    //             y: minHeight
    //         }, {
    //             x: maxWidth,
    //             y: minHeight
    //         }, {
    //             x: maxWidth,
    //             y: maxHeight
    //         }, {
    //             x: maxHeight * minAspect,
    //             y: maxHeight
    //         }, {
    //             x: minWidth,
    //             y: minWidth / minAspect
    //         }]
    //     ]);
    // });
    // b.it('can cut off both the bottom-left and top-right corners to make a hexagon', function (t) {
    //     var width = 100;
    //     var height = 100;
    //     var minAspect = 0.5;
    //     var maxAspect = 2;
    //     var maxHeight = 1000;
    //     var maxWidth = 1000;
    //     var minWidth = width / 10;
    //     var minHeight = height / 10;
    //     t.expect(boxography([{
    //         width: width,
    //         height: height,
    //         minAspect: minAspect,
    //         maxAspect: maxAspect,
    //         maxHeight: maxHeight,
    //         maxWidth: maxWidth
    //     }]).bounds).toEqual([
    //         [{
    //             x: minWidth,
    //             y: minHeight
    //         }, {
    //             x: minHeight * maxAspect,
    //             y: minHeight
    //         }, {
    //             x: maxWidth,
    //             y: maxWidth / maxAspect
    //         }, {
    //             x: maxWidth,
    //             y: maxHeight
    //         }, {
    //             x: maxWidth * minAspect,
    //             y: maxHeight
    //         }, {
    //             x: minWidth,
    //             y: minWidth / minAspect
    //         }]
    //     ]);
    // });
    // b.it('can handle multiple layouts', function (t) {
    //     var aMinY = 40;
    //     var aMinX = 20;
    //     var bMinY = 20;
    //     var bMinX = 40;
    //     t.expect(boxography([{
    //         width: 200,
    //         height: 400
    //     }, {
    //         width: 400,
    //         height: 200
    //     }]).bounds).toEqual([
    //         [{
    //             x: aMinX,
    //             y: aMinY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: aMinY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: LARGE_INTEGER
    //         }, {
    //             x: aMinX,
    //             y: LARGE_INTEGER
    //         }],
    //         [{
    //             x: bMinX,
    //             y: bMinY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: bMinY
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: LARGE_INTEGER
    //         }, {
    //             x: bMinX,
    //             y: LARGE_INTEGER
    //         }]
    //     ]);
    // });
});