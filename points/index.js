var _ = require('debit');
module.exports = boxography;
var indexMap = {
    height: 1,
    width: 0
};

function combinations(layoutManager, fn, memo) {
    var target, subset, i = 0;
    while (i < layoutManager.length()) {
        target = layoutManager.item(i);
        subset = layoutManager.slice(i + 1);
        subset.reduce(fn(target), memo);
        i += 1;
    }
}

function runLimit(layoutManager, scaled, method) {
    var byId = scaled.byId;
    scaled[method] = {
        x: runLimitDirection('width'),
        y: runLimitDirection('height')
    };

    function runLimitDirection(key) {
        return layoutManager.reduce(function (memo, layout) {
            var layoutvalue = layout.dimensionBoundary(method, key) * layout[method + 'Scale'](method);
            var identified = byId[layout.id] = byId[layout.id] || {};
            var dir = identified[method] = identified[method] || [0, 0];
            dir[indexMap[key]] = layoutvalue;
            var value = Math[method](memo, layoutvalue);
            return value;
        }, method === 'max' ? 0 : Infinity);
    }
}

function limits(layoutManager) {
    var byId = {};
    var scaled = {
        byId: byId,
        forEachMax: function (fn) {
            _.forOwn(byId, function (points, key) {
                fn(point.max[0], point.max[1]);
            });
        },
        forEachMin: function (fn) {
            _.forOwn(byId, function (points, key) {
                fn(point.min[0], point.min[1]);
            });
        },
        forEach: function (fn) {
            _.forOwn(byId, function (point) {
                fn(point.min[0], point.min[1], point.max[0], point.max[1]);
            });
        }
    };
    runLimit(layoutManager, scaled, 'min');
    runLimit(layoutManager, scaled, 'max');
    return scaled;
}

function intersections(layoutManager) {
    var allIntersections = [];
    var byIdIntersections = {};
    combinations(layoutManager, function iterate(target) {
        return function (memo, b) {
            var mutation = permutations(target, b);
            setIntersection(target, b, mutation);
            setIntersection(b, target, mutation);
            allIntersections.push({
                a: target.id,
                b: b.id,
                mutation: mutation
            });
        };
    });
    return {
        byId: byIdIntersections,
        all: allIntersections,
        forEach: function (fn) {
            _.forEach(allIntersections, function (item) {
                fn(item.mutation[0], item.mutation[1], item);
            });
        }
    };

    function setIntersection(from, to, mutation) {
        var cache = byIdIntersections[from.id] = byIdIntersections[from.id] || {};
        cache[to.id] = mutation;
    }
}

function boxography(layoutManager) {
    var aggregator = {};
    aggregator.scaled = limits(layoutManager, aggregator);
    aggregator.intersections = intersections(layoutManager);
    return aggregator;
}

function permutations(a, b, memo) {
    // individualPoints(a, crosshairs);
    // individualPoints(b, crosshairs);
    var p1 = [a.midpointWidth(), a.midpointHeight()];
    var p2 = [b.midpointWidth(), b.midpointHeight()];
    var slope1 = p1[1] / p1[0];
    var slope2 = p2[1] / p2[0];
    var average = Math.sqrt(slope1) * Math.sqrt(slope2);
    var multi = 1000;
    var avg = [multi, average * multi];
    if (slope1 === slope2) {
        var x = Math.sqrt(p1[0] / slope2) * Math.sqrt(p2[0]);
        var y = Math.sqrt(p1[1] / slope2) * Math.sqrt(p2[1]);
        return [x, y];
    } else {
        // line(p1[0], p1[1], p2[0], p2[1]);
        // line(0, 0, s1 * 100, s2 * 100);
        // A = y2-y1
        // B = x1-x2
        // C = A*x1+B*y1
        // do for 1 and 2
        var A1 = p2[1] - p1[1];
        var B1 = p1[0] - p2[0];
        var C1 = A1 * p1[0] + B1 * p1[1];
        var A2 = avg[1] - 0;
        var B2 = 0 - avg[0];
        var C2 = A2 * 0 + B2 * 0;
        // double det = A1 * B2 - A2 * B1
        // if (det == 0) {
        //     //Lines are parallel
        // } else {
        //     double x = (B2*C1 - B1*C2) / det
        //     double y = (A1*C2 - A2*C1) / det
        // }
        var det = (A1 * B2) - (A2 * B1);
        var X = ((B2 * C1) - (B1 * C2)) / det;
        var Y = ((A1 * C2) - (A2 * C1)) / det;
        return [X, Y];
        // line(0, 0, X * 100, Y * 100);
    }
}
// function crosshairs(x, y, w_, h_, color_) {
//     var w = w_ || 13,
//         h = h_ || 13,
//         halfwidth = Math.floor(w / 2),
//         halfheight = Math.floor(h / 2),
//         x_ = x - halfwidth,
//         y_ = y - halfheight,
//         x__ = x_,
//         y__ = y_,
//         color = color_ || 'black';
//     context.fillStyle = color;
//     line(x, y_, x, y_ + h);
//     line(x_, y, x_ + w, y);
// }
// function line(x1, y1, x2, y2) {
//     context.fillStyle = 'black';
//     context.beginPath();
//     context.moveTo(Math.round(x1), Math.round(y1));
//     context.lineTo(Math.round(x2), Math.round(y2));
//     // context.lineWidth = 1;
//     context.stroke();
// }