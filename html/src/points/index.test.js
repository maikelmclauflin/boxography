var $canvas = document.querySelectorAll('#canvas')[0],
    context = $canvas.getContext('2d'),
    allLayouts = require('../layoutbackup'),
    boxography = require('../../../points'),
    reduce = require('@timelaps/array/reduce'),
    layout = require('@specless/layout'),
    LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER,
    b = require('@timelaps/batterie');
var forOwn = require('@timelaps/n/for/own');
var forEach = require('@timelaps/n/for/each');
window.addEventListener('resize', setCanvasSize);
window.addEventListener('orientationchange', setCanvasSize);
// setCanvasSize();

function draw() {
    // b.it('handles regular boxes', function (t) {
    //     var min = 30;
    //     t.expect(create({
    //         name: 'one',
    //         width: [300],
    //         height: [300]
    //     }).bounds).toEqual([
    //         [{
    //             x: min,
    //             y: min
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: min
    //         }, {
    //             x: LARGE_INTEGER,
    //             y: LARGE_INTEGER
    //         }, {
    //             x: min,
    //             y: LARGE_INTEGER
    //         }]
    //     ]);
    // });

    // function create(layout) {
    //     return boxography([layout], {
    //         width: window.innerWidth,
    //         height: window.innerHeight
    //     }, function (point) {
    //         return layout.closest([layout], {
    //             width: point[0],
    //             height: point[1]
    //         }).name;
    //     });
    // }
    // forEach(bounds, function (polygon) {
    //     reduce(polygon, function (memo, point) {
    //         line(memo.x, memo.y, point.x, point.y);
    //         return point;
    //     }, polygon[polygon.length - 1]);
    // });
    // forEach(result.aspects, function (point) {
    //     line(0, 0, point.x, point.y);
    // });
    // forEach(result.groups, function (group) {
    //     crosshairs(group.x, group.y);
    // });
    // forEach(result.intersections, function (group) {
    //     crosshairs(group.x, group.y);
    // });
    console.log(result);
    // _.forEach(result, function (point) {
    //     crosshairs(point[0], point[1]);
    // });
    // forOwn(result, function (polygon, key) {
    //     var first, previous;
    //     // if (key !== 'a') {
    //     //     return;
    //     // }
    //     forEach(polygon, function (point) {
    //         if (previous) {
    //             line(previous[0], previous[1], point[0], point[1]);
    //         } else {
    //             first = point;
    //         }
    //         previous = point;
    //     });
    //     if (previous) {
    //         line(previous[0], previous[1], first[0], first[1]);
    //     }
    // });
    // result.scaled.forEach(rectangle);
    // result.points.forEach(function (x, y, id) {
    //     crosshairs(x, y);
    // });
    // result.crossOvers.forEach(function (x, y) {
    //     line(0, 0, x * 1000, y * 1000);
    // });
    // _.forEach(result.points.all, function (a, index) {
    //     _.forEach(result.points.all.slice(index + 1), function (b) {
    //         crosshairs(a[0], b[1]);
    //         crosshairs(b[0], a[1]);
    //     });
    // });
    // _.forOwn({
    //     x: function (slope, x2, y2) {
    //         return [x2, result.fromConstantX(0, 0, slope, x2)];
    //     },
    //     y: function (slope, x2, y2) {
    //         return [result.fromConstantY(0, 0, slope, y2), y2];
    //     }
    // }, function (fn, key) {
    //     result.borders.forEach(function (x1, y1) {
    //         _.forEach(result.points.all, function (point) {
    //             var p = fn(y1 / x1, point[0], point[1]);
    //             crosshairs(p[0], p[1]);
    //         });
    //     });
    // });
    // _.forEach(result.points.slice(0), function (point, index) {
    //     _.forEach(result.points.slice(index + 1), function () {
    //         //
    //     });
    // });
    // result.crossOvers.forEach(function (x_, y_, a, b) {
    //     var x = x_;
    //     var y = y_;
    //     crosshairs(x, y);
    //     var amax = result.scaled.byId[a].max;
    //     var bmax = result.scaled.byId[b].max;
    //     var xmax = Math.max(amax[0], bmax[0]);
    //     var ymax = Math.max(amax[1], bmax[1]);
    //     var maxslope = ymax / xmax;
    //     var slope = y / x;
    //     if (maxslope > slope) {
    //         // it's going to hit x first
    //         x = xmax;
    //         y = slope * xmax;
    //     } else {
    //         // it's going to hit y first
    //         y = ymax;
    //         x = ymax / slope;
    //     }
    //     line(0, 0, x, y);
    // });
    // result.borders.forEach(function (x, y) {
    //     line(0, 0, x, y);
    // });
    // layoutManager.forEach(function (layout, index) {
    //     square(layout.midpointWidth(), layout.midpointHeight(), layout.minWidth() - layout.maxWidth(), layout.minHeight() - layout.maxHeight());
    //     var target, i = index + 1;
    //     while (i < layoutManager.length()) {
    //         target = layoutManager.item(i);
    //         line(layout.midpointWidth(), layout.midpointHeight(), target.midpointWidth(), target.midpointHeight());
    //         i += 1;
    //     }
    // });
}

function square(x, y, w_, h_, color) {
    var w = w_ || 13,
        h = h_ || 13,
        halfwidth = Math.floor(w / 2),
        halfheight = Math.floor(h / 2),
        x_ = x - halfwidth,
        y_ = y - halfheight,
        x__ = x + halfwidth,
        y__ = y + halfheight;
    rectangle(x_, y_, x__, y__, color);
}

function rectangle(x_, y_, x__, y__, color) {
    line(x_, y_, x_, y__, color);
    line(x_, y__, x__, y__, color);
    line(x__, y__, x__, y_, color);
    line(x__, y_, x_, y_, color);
}

function crosshairs(x, y, w_, h_, color) {
    var w = w_ || 13,
        h = h_ || 13,
        halfwidth = Math.floor(w / 2),
        halfheight = Math.floor(h / 2),
        x_ = x - halfwidth,
        y_ = y - halfheight,
        x__ = x_,
        y__ = y_;
    context.fillStyle = color;
    line(x, y_, x, y_ + h, color);
    line(x_, y, x_ + w, y, color);
}

function line(x1, y1, x2, y2, color) {
    context.fillStyle = color || 'black';
    context.beginPath();
    context.moveTo(Math.round(x1), Math.round(y1));
    context.lineTo(Math.round(x2), Math.round(y2));
    context.stroke();
}

function setCanvasSize() {
    $canvas.height = window.innerHeight;
    $canvas.width = window.innerWidth;
    draw();
}