var isEqual = require('@timelaps/is/equal');
var find = require('@timelaps/array/find');
var indexOf = require('@timelaps/n/index/of');
var filter = require('@timelaps/array/filter');
var uniqueWith = require('@timelaps/array/unique/with');
var reduce = require('@timelaps/array/reduce');
var map = require('@timelaps/n/map');
var combinations = require('@timelaps/array/combinations');
var forEach = require('@timelaps/n/for/each');
var create = require('@specless/layout/create');
var round = require('@timelaps/number/round');
var layout = require('@specless/layout');
var unique = require('@timelaps/array/unique');
var boundaries = require('../boundaries');
var createLoss = require('../cut');
var counter = 0;
module.exports = boxography;
var indexMap = {
    height: 1,
    width: 0
};
var oppositeMap = {
    width: 'height',
    height: 'width'
};
var indexArray = reduce(indexMap, function (memo, index, key) {
    memo[index] = key;
    return memo;
}, []);
var constantMap = {
    min: 'height',
    max: 'width'
};

function combinations(layouts, fn, memo_) {
    var target, subset, i = 0,
        memo = memo_;
    while (i < layouts.length) {
        target = layouts[i];
        subset = layouts.slice(i + 1);
        memo = reduce(subset, fn(target), memo);
        i += 1;
    }
    return memo;
}

function runLimit(layouts, scaled, method) {
    var byId = scaled.byId;
    scaled[method] = {
        x: runLimitDirection('width'),
        y: runLimitDirection('height')
    };

    function runLimitDirection(key) {
        return reduce(layouts, function (memo, layout) {
            var layoutvalue = layout.dimensionBoundary(method, key) * layout[method + 'Scale'](method);
            var identified = byId[layout.id] = byId[layout.id] || {};
            var dir = identified[method] = identified[method] || [0, 0];
            dir[indexMap[key]] = layoutvalue;
            var value = Math[method](memo, layoutvalue);
            return value;
        }, method === 'max' ? 0 : Infinity);
    }
}
// function limits(layouts) {
//     var byId = {};
//     var scaled = {
//         byId: byId,
//         forEachMax: function (fn) {
//             _.forOwn(byId, function (points, key) {
//                 fn(point.max[0], point.max[1]);
//             });
//         },
//         forEachMin: function (fn) {
//             _.forOwn(byId, function (points, key) {
//                 fn(point.min[0], point.min[1]);
//             });
//         },
//         forEach: function (fn) {
//             _.forOwn(byId, function (point) {
//                 fn(point.min[0], point.min[1], point.max[0], point.max[1]);
//             });
//         }
//     };
//     runLimit(layouts, scaled, 'min');
//     runLimit(layouts, scaled, 'max');
//     return scaled;
// }
function crossOvers(layouts) {
    return combinations(layouts, function iterate(memo, a) {
        return function (intersections, b) {
            var intersect = intersection(a, b);
            // setIntersection(a, b, intersect);
            // setIntersection(b, a, intersect);
            intersections.push([ //
                round(intersect[0], -8), //
                round(intersect[1], -8)
            ].concat([a.id, b.id]));
            return memo;
        };
    }, []);
}

// function computeBoundaries(layouts, dims) {
//     return reduce(layouts, function (points, layout) {
//         var id = layout.id;
//         var bounds = boundaries(layout, dims);
//         var set = points[id] = points[id] || {};
//         set.bounds = bounds;
//         return points;
//     }, {});
// }

function averager(dim) {
    return function (a) {
        return computeAverage(layout.min[dim](a), layout.max[dim](a));
    };
}

function computeAverage(a, b) {
    return (a + b) / 2;
}
// function aspectBoundaries(layouts) {
//     return combinations(layouts, function (memo, a) {
//         var bounds = computeLayoutBounds(a);
//         return function (memo, b) {
//             var coords = intersection(a, b);
//             var bounds = computeLayoutBounds(b);
//             var x = coords.x;
//             var y = coords.y;
//             var maxWidth = Math.max(a.maxWidth, b.maxWidth);
//             var maxHeight = Math.max(a.maxHeight, b.maxHeight);
//             var aspect = x / y;
//             var maxAspect = maxWidth / maxHeight;
//             if (maxAspect === aspect) {
//                 // do nothing
//             } else if (maxAspect > aspect) {
//                 maxWidth = aspect * maxHeight;
//             } else if (maxAspect < aspect) {
//                 maxHeight = maxWidth / aspect;
//             } else {
//                 // is nan
//             }
//             memo.push({
//                 x: maxWidth,
//                 y: maxHeight,
//                 value: coords.x / coords.y,
//                 base: coords
//             });
//             return memo;
//         };
//     }, []);
// }
function computeFromConstantY(x1, y1, slope, y2) {
    return y2 > y1 ? ((y2 - y1) / slope) + x1 : (slope < 1 ? y2 / slope : y2 * slope);
}

function computeFromConstantX(x1, y1, slope, x2) {
    return x2 > x1 ? ((x2 - x1) * slope) + y1 : (slope > 1 ? x2 * slope : x2 / slope);
}

function computeNextPoint(limitX, limitY) {
    return function (x, y, slope) {
        return (limitY - y) / (limitX - x) > slope ? [limitX, computeFromConstantX(x, y, slope, limitX)] : [computeFromConstantY(x, y, slope, limitY), limitY];
    };
}

function nextInfluence(x, y, slope, points) {
    // where you currently are
    var reduced = reduce(points, function (memo, point) {
        return computeNextPointCloser(memo, point);
    });

    function computeNextPointCloser(memo, point) {
        var da, db;
        if (!memo) {
            // it's bigger. it will work
            da = computeDistance(x, y, slope, point[0], point[1]);
            return da ? da : null;
            // make sure that this layout can be larger than the previou s
        } else {
            // if (abs(memo[0] - x) > abs(point[0] - x)) {}
            db = computeDistance(x, y, slope, point[0], point[1]);
            if (!db) {
                return memo;
            }
            da = computeDistance(x, y, slope, memo[0], memo[1]);
            // if (slope === Infinity) {} else {
            // }
            // if (slope === 0) {} else {
            // }
        }
    }
}

function abs(num) {
    return num > 0 ? num : -num;
}

function computeDistance(x1, y1, slope, x2, y2) {
    if (x2 > x1) {
        if (y2 > y1) {
            // bottom right. both could influence
            return computeNextPoint(x2, y2)(x1, y1, slope);
        } else {
            // top right. y is the only thing that can influence
            return [computeFromConstantY(x1, y1, slope, y2), y2];
        }
    } else {
        if (y2 > y1) {
            // bottom left. x is the only thing that can influence
            return [x2, computeFromConstantX(x1, y1, slope, x2)];
        } else {
            // top left
            // ignore. axis previous to both x and y have no effect
        }
    }
}

function overlap(a, b) {
    return {
        minWidth: Math.max(a.minWidth, b.minWidth),
        minHeight: Math.max(a.minHeight, b.minHeight),
        maxWidth: Math.min(a.maxWidth, b.maxWidth),
        maxHeight: Math.min(a.maxHeight, b.maxHeight)
    };
}
// function computeGroups(bounds) {
//     if (!bounds.length) {
//         return [];
//     }
//     return combinations(bounds, function (memo, a) {
//         return function (memo, b) {
//             var x = [a.minWidth, b.minWidth, a.maxWidth, b.maxWidth];
//             var y = [a.minHeight, b.minHeight, a.maxHeight, b.maxHeight];
//             x = unique(x);
//             y = unique(y);
//             forEach(x, function (x) {
//                 forEach(y, function (y) {
//                     memo.push({
//                         x: x,
//                         y: y
//                     });
//                 });
//             });
//             return memo;
//         };
//     }, []);
//     function compute(overflowing) {
//         return function (list, a, b) {
//             var overflow = overflowing(a, b);
//             return overflow ? list.concat(overflow) : list;
//         };
//     }
//     function computeGroup(groups, layout) {
//         var next = [];
//         var bounds = computeLayoutBounds(layout);
//         return next;
//     }
// }
// function computeLayoutBounds(layout) {
//     var scale = layout.scale;
//     var width = layout.width;
//     var height = layout.height;
//     var minScale = scale[0];
//     var maxScale = scale[1];
//     var minWidth = Math.max(layout.minWidth, width[0] * minScale);
//     var minHeight = Math.max(layout.minHeight, height[0] * minScale);
//     var maxWidth = Math.min(layout.maxWidth, width[1] * maxScale);
//     var maxHeight = Math.min(layout.maxHeight, height[1] * maxScale);
//     return {
//         minWidth: minWidth,
//         minHeight: minHeight,
//         maxWidth: maxWidth,
//         maxHeight: maxHeight
//     };
// }
function computeIntersections(aspects, groups) {
    return reduce(aspects, function (memo, aspect) {
        return memo.concat(reduce(groups, function (memo, coord) {
            if (aspect === coord.x / coord.y) {
                return memo;
            }
            return memo.concat([ //
                computeXIntersection(aspect, coord), //
                computeYIntersection(aspect, coord) //
            ]);
        }, []));
    }, []);
}

function computeXIntersection(aspect, coord) {
    return {
        x: coord.x,
        y: coord.y * aspect.value
    };
}

function computeYIntersection(aspect, coord) {
    return {
        x: aspect.value / coord.x,
        y: coord.y
    };
}

function computeHorizontalLine(lines, moreNegative, y, minX, maxX) {}

function computeVerticalLine(lines, moreNegative, x, minY, maxY) {
    // if ()
}

function computeSegmentBounds(bounds, lines) {
    return reduce(bounds, function (lines) {}, lines);
}
// function computeOutline(bounds, lines) {
//     return reduce(bounds, function (memo, rect) {
//         var top = {
//             minHeight: rect.minHeight,
//             minWidth: rect.minWidth,
//             maxWidth: rect.maxWidth
//         };
//         var bottom = {
//             minHeight: rect.maxHeight,
//             minWidth: rect.minWidth,
//             maxWidth: rect.maxWidth
//         };
//         var left = {
//             minWidth: rect.minWidth,
//             minHeight: rect.minHeight,
//             maxHeight: rect.maxHeight
//         };
//         var right = {
//             maxWidth: rect.maxWidth,
//             minHeight: rect.minHeight,
//             maxHeight: rect.maxHeight
//         };
//         return memo.concat(top, bottom, left, right);
//     }, lines);
// }
function boxography(layouts_, dims, test) {
    return reduce(layouts_, function (data, layout_) {
        var layout = create(layout_);
        var id = layout.id;
        var bounds = boundaries(layout, dims);
        var maxLoss = createLoss(bounds, layout.maxAspect, Infinity);
        var minLoss = createLoss(bounds, layout.minAspect, 0);
        var datum = {
            layout: layout,
            bounds: bounds,
            losses: minLoss.concat(maxLoss)
        };
        data[id] = datum;
        return data;
    }, {});
}
// function computeIntersections(angledIntersections) {
//     return combinations(angledIntersections, function (memo, a) {
//         var x1 = a[0];
//         var y1 = a[1];
//         var slope1 = y1 / x1;
//         return function (intersections, b) {
//             var x2 = b[0];
//             var y2 = b[1];
//             var slope2 = y2 / x2;
//             if (slope1 === slope2) {
//                 //
//             } else if (slope2 > slope1) {
//                 intersections.push([y2, x1]);
//             } else {
//                 intersections.push([y1, x2]);
//             }
//             return intersections;
//         };
//     }, []);
// }
// function computeAngledIntersections(points, borders) {
//     var intersections = [];
//     var xs = allPoints(0);
//     var ys = allPoints(1);
//     forEach(xs, function (x) {
//         forEach(ys, function (y) {
//             intersections.push([x, y]);
//         });
//     });
//     forEach(borders, function (border) {
//         var x1 = border[0];
//         var y1 = border[1];
//         var slope = y1 / x1;
//         forEach(xs, function (x) {
//             intersections.push([x, round(computeFromConstantX(x1, y1, slope, x), -8)]);
//         });
//         forEach(ys, function (y) {
//             intersections.push([round(computeFromConstantY(x1, y1, slope, y), -8), y]);
//         });
//     });
//     return intersections;
//     function allPoints(index) {
//         return reduce(points, function (memo, point) {
//             var target = point[index];
//             if (!memo.hash[target]) {
//                 memo.hash[target] = true;
//                 memo.list.push(target);
//             }
//             return memo;
//         }, {
//             list: [],
//             hash: {}
//         }).list;
//     }
// }
// function solve(layouts, points, test) {
//     // var squares = [];
//     var copy = points.slice(0);
//     var byX = copy.slice(0).sort(function (a, b) {
//         return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1));
//     });
//     var byY = copy.slice(0).sort(function (a, b) {
//         return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : (a[0] < b[0] ? -1 : 1));
//     });
//     var list = reduce(copy, function (memo, point) {
//         var x = point[0];
//         var y = point[1];
//         if (!memo.hash.x[x]) {
//             memo.hash.x[x] = true;
//             memo.list.x.push(x);
//         }
//         if (!memo.hash.y[y]) {
//             memo.hash.y[y] = true;
//             memo.list.y.push(y);
//         }
//         return memo;
//     }, {
//         list: {
//             x: [],
//             y: []
//         },
//         hash: {
//             x: {},
//             y: {}
//         }
//     }).list;
//     list.x.sort(function (a, b) {
//         return a < b ? -1 : 1;
//     });
//     list.y.sort(function (a, b) {
//         return a < b ? -1 : 1;
//     });
//     var squares = reduce(points, function (squares, point) {
//         var x = point[0];
//         var y = point[1];
//         adds(byX, both);
//         // adds(byX, justX);
//         // adds(byX, justY);
//         adds(byY, both);
//         // adds(byY, justX);
//         // adds(byY, justY);
//         return squares;
//         function justX(point) {
//             return x < point[0];
//         }
//         function justY(point) {
//             return y < point[1];
//         }
//         function both(point) {
//             return justX(point) && justY(point);
//         }
//         function adds(array, filter) {
//             var x_, y_, indexX = indexOf(array, point);
//             var closest = find(array, filter);
//             if (closest) {
//                 x_ = closest[0];
//                 y_ = closest[1];
//                 squares.push([
//                     [x, y],
//                     [x_, y],
//                     [x_, y_],
//                     [x, y_]
//                 ]);
//             }
//         }
//     }, []);
//     // console.log(squares.length);
//     // console.log(uniqueWith(squares, isEqual).length);
//     return filter(uniqueWith(squares, isEqual), function (square) {
//         var a = test(square[0]);
//         var b = test(square[1]);
//         var c = test(square[2]);
//         var d = test(square[3]);
//         return a === b && a === c && a === d;
//     });
//     // function test(point) {
//     //     return layouts.closest({
//     //         width: point[0],
//     //         height: point[1]
//     //     });
//     // }
//     // var solved = {};
//     // // console.log(points);
//     // forEach(points, function (point) {
//     //     var x = point[0];
//     //     var y = point[1];
//     //     // forEach([
//     //     //     [x, y]
//     //     // ], function (p) {
//     //     //     var x = p[0];
//     //     //     var y = p[1];
//     //     if (!x || !y) {
//     //         return;
//     //     }
//     //     var layout = layouts.closest({
//     //         width: x,
//     //         height: y
//     //     });
//     //     // if ((x > 1000 || y > 1000) && layout.id === 'a') {
//     //     //     layouts.forget(x, y);
//     //     //     layouts.forEach(function (layout) {
//     //     //         var registry = layout.directive('Registry');
//     //     //         forEach(['coverage', 'scalingDimension', 'scale', 'render', 'contexts'], function (key) {
//     //     //             registry.drop(key, [x, y].join(','));
//     //     //         });
//     //     //     });
//     //     //     layout = layouts.closest({
//     //     //         width: x,
//     //     //         height: y
//     //     //     });
//     //     // }
//     //     var id = layout.id;
//     //     var target = solved[id] = solved[id] || {
//     //         all: [],
//     //         x: [],
//     //         y: [],
//     //         hash: {}
//     //     };
//     //     var hash = target.hash;
//     //     var xhash = hash[x] = hash[x] || {};
//     //     var yhash = xhash[y] = xhash[y] = true;
//     //     target.x.push(x);
//     //     target.y.push(y);
//     //     target.all.push([x, y]);
//     //     // });
//     // });
//     // console.log(solved);
//     // var copy = points.slice(0);
//     // var byX = copy.slice(0).sort(function (a, b) {
//     //     return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1));
//     // });
//     // var byY = copy.slice(0).sort(function (a, b) {
//     //     return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : (a[0] < b[0] ? -1 : 1));
//     // });
//     // console.log(byX);
//     // var squares = reduce(byX, function (squares, point) {
//     //     var x1 = point[0];
//     //     var y1 = point[1];
//     //     var indexX = _.indexOf(byX, point);
//     //     // var indexY = _.indexOf(byY, point);
//     //     // var nextByX = find(byX, function (point) {
//     //     // }, indexX + 1);
//     // }, []);
//     // return _.mapValues(solved, function (result, key) {
//     //     var minX = Math.min.apply(null, result.x);
//     //     // var maxX = Math.max.apply(null, result.x);
//     //     var minY = Math.min.apply(null, result.y);
//     //     // var maxY = Math.max.apply(null, result.y);
//     //     // var center = {
//     //     //     x: (maxX - minX) / 2,
//     //     //     y: (maxY - minY) / 2
//     //     // };
//     //     console.log(minX, minY);
//     //     var copy = result.all.slice(0);
//     //     var byX = copy.slice(0).sort(function (a, b) {
//     //         return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : (a[1] < b[1] ? -1 : 1));
//     //     });
//     //     var byY = copy.slice(0).sort(function (a, b) {
//     //         return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : (a[0] < b[0] ? -1 : 1));
//     //     });
//     //     var path = [];
//     //     moveToPath(_.findKey(copy, function (point) {
//     //         return _.isEqual(point, [minX, minY]);
//     //     }));
//     //     if (!path[0]) {
//     //         debugger;
//     //     }
//     //     var index = 0;
//     //     while (copy.length) {
//     //         moveToPath(index);
//     //         // index;
//     //     }
//     //     return path;
//     //     function moveToPath(index) {
//     //         var point = copy.splice(index, 1)[0];
//     //         path.push(point);
//     //     }
//     //     return result.all.slice(0).sort(function (a, b) {
//     //         return (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
//     //     });
//     // });
//     // var points = aggregator.points.all;
//     // var mins = reduce(points, function (memo, point) {
//     //     if (memo.x[0] > point[0]) {
//     //         memo.x = point.slice(0);
//     //     }
//     //     if (memo.y[1] > point[1]) {
//     //         memo.y = point.slice(0);
//     //     }
//     //     return memo;
//     // }, {
//     //     x: [Infinity, Infinity],
//     //     y: [Infinity, Infinity]
//     // });
//     // return reduce([mins.x, mins.y], function (memo, point) {
//     //     var next, index = 0,
//     //         polygon = [point],
//     //         iteration = 0,
//     //         add = adds(polygon);
//     //     memo.push(polygon);
//     //     while ((next = polygon[polygon.length - 1]) && iteration < 100 && (polygon.length < 2 || !_.isEqual(point, next))) {
//     //         findNext(next, add);
//     //         iteration += 1;
//     //     }
//     // }, []);
//     // function pointExists(polygon, x, y) {
//     //     return find(polygon, function (point) {
//     //         return point[0] === x && point[1] === y;
//     //     });
//     // }
//     // function adds(polygon) {
//     //     return function (x, y) {
//     //         if (!pointExists(polygon, x, y)) {
//     //             polygon.push([x, y]);
//     //         }
//     //     };
//     // }
//     // function findNext(point, add) {
//     //     var x = point[0];
//     //     var y = point[1];
//     //     var id = point[2];
//     //     var next = collectRelevantPointsForPoint(points, x, y);
//     //     var diagonals = collectDiagonals(aggregator.crossOvers, x, y, id);
//     //     var reducedDiagonals = borders(layouts, diagonals);
//     //     _.forOwn({
//     //         min: function (point) {
//     //             return point[0] > x;
//     //         },
//     //         max: function (point) {
//     //             return point[1] > y;
//     //         }
//     //     }, function (filter, dir) {
//     //         var diagonal = reducedDiagonals[dir];
//     //         if (diagonal) {
//     //             diagonalMove(x, y, diagonal, add);
//     //         } else {
//     //             goUntilLimit(x, y, id, add, dir);
//     //         }
//     //     });
//     // }
//     // function diagonalMove(x, y, diagonal, add) {
//     //     // add([diagonal[0], diagonal[1]]);
//     // }
//     // function goUntilLimit(x, y, id, add, key) {
//     //     var index, minscale, point = [x, y];
//     //     var p2 = [];
//     //     var dimension = constantMap[key];
//     //     var layout = layouts.reduce(function (memo, layout) {
//     //         if (id === layout.id) {
//     //             return;
//     //         }
//     //         var aspect = x / y;
//     //         var clampedAspect = layout.clampAspect(aspect);
//     //         if (aspect === clampedAspect) {
//     //             // equal.
//     //             // not calculating at this time since equal aspect ratios never intersect
//     //             return;
//     //         } else if (key === 'min' && clampedAspect > aspect) {
//     //             return;
//     //         } else if (key === 'max' && clampedAspect < aspect) {
//     //             return;
//     //         }
//     //         // var dimension = constantMap[key];
//     //         var minDimension = layout.minDimension(dimension);
//     //         var min = layout.minScale() * minDimension;
//     //         var index = indexMap[dimension];
//     //         var oppositeIndex = (index + 1) % 2;
//     //         var dimensions = {};
//     //         var targetPoint = point[oppositeIndex];
//     //         dimensions[indexArray[index]] = min;
//     //         dimensions[indexArray[oppositeIndex]] = targetPoint;
//     //         if (!layout.tooBig(dimensions)) {
//     //             if (!memo) {
//     //                 return layout;
//     //             } else {
//     //                 return Math.abs(layout.minDimension(dimension) * layout.minScale() - point[index]) > Math.abs(memo.minDimension(dimension) * layout.minScale() - point[index]) ? memo : layout;
//     //             }
//     //         }
//     //     });
//     //     if (layout) {
//     //         index = indexMap[dimension];
//     //         p2[index] = layout.minDimension(dimension) * layout.minScale();
//     //         otherIndex = (index + 1) % 2;
//     //         minscale = layout.minScale();
//     //         p2[otherIndex] = layout.minDimension(oppositeMap[dimension]) * minscale;
//     //         layout.minDimension(dimension) * minscale;
//     //         add(p2[0], p2[1]);
//     //     }
//     // }
//     // function collectDiagonals(crossOvers, x, y, id) {
//     //     return reduce(crossOvers.all, function (diagonals, intersection) {
//     //         var intersectSlope, slope, iy, ix,
//     //             a = intersection.a,
//     //             b = intersection.b;
//     //         if (intersection.a === id || intersection.b === id) {
//     //             iy = intersection.intersect[1];
//     //             ix = intersection.intersect[0];
//     //             altId = a === id ? b : a;
//     //             intersectSlope = iy / ix;
//     //             slope = y / x;
//     //             if (slope > intersectSlope) {
//     //                 // hits y
//     //                 diagonals.push([x, computeFromConstantX(ix, iy, intersectSlope, x), id, altId]);
//     //             } else if (slope < intersectSlope) {
//     //                 // hits x first
//     //                 diagonals.push([computeFromConstantY(ix, iy, intersectSlope, y), y, id, altId]);
//     //             }
//     //         }
//     //     }, []);
//     // }
// }
// function collectRelevantPointsForPoint(points, x, y) {
//     return _.filter(points, function (point) {
//         return point[0] === x || point[1] === y;
//     });
// }
// function getPoint(points, index) {
//     return uniqueWith(_.map(points, function (point) {
//         return point[index];
//     }), isEqual);
// }
// function borders(layouts, crossOvers, limitX, limitY) {
//     var byId = {};
//     forEach(crossOvers, function (point) {
//         var x = point[0],
//             y = point[1],
//             a_id = point[2],
//             b_id = point[3];
//         var a = get(a_id);
//         var b = get(b_id);
//         reduceAgainst(byId, [x, y], a, b);
//         reduceAgainst(byId, [x, y], b, a);
//     });
//     // forEach(function (x2, y2, dir, ida, idb) {
//     //     var a = get(ida);
//     //     var b = get(idb);
//     //     var largestMissingSegment = [ //
//     //         Math.max(0, a.minWidth() * a.minScale(), b.minWidth() * b.minScale()), //
//     //         Math.max(0, a.minHeight() * a.minScale(), b.minHeight() * b.minScale()), //
//     //         Math.min(Infinity, a.maxWidth() * a.maxScale(), b.maxWidth() * b.maxScale()), //
//     //         Math.min(Infinity, a.maxHeight() * a.maxScale(), b.maxHeight() * b.maxScale()) //
//     //     ];
//     // });
//     return {
//         byId: byId,
//         forEach: forEach
//     };
//     function get(id) {
//         return layouts.directive('Registry').get('layouts', id);
//     }
//     function forEach(fn) {
//         _.forOwn(byId, function (item, id) {
//             _.forOwn(item, function (coords, key) {
//                 fn(coords[0], coords[1], key === 'false' ? false : key, id, coords[2]);
//             });
//         });
//     }
//     function reduceAgainst(memo, intersect, origin, target) {
//         var origin_id = origin.id,
//             original = memo[origin_id] = memo[origin_id] || {},
//             result = {},
//             y = intersect[1],
//             x = intersect[0],
//             aspect = x / y,
//             dir = calculateAspect(),
//             newness = [x, y, target.id],
//             previous = original[dir];
//         // if (x < limitX || y < limitY) {
//         //     return;
//         // }
//         if (!target.tooBig({
//                 width: x,
//                 height: y
//             })) {
//             if (!previous) {
//                 original[dir] = newness;
//             } else {
//                 if (dir === 'min') {
//                     if (previous[0] / previous[1] < x / y) {
//                         original[dir] = newness;
//                     }
//                 } else if (dir === 'max') {
//                     if (previous[0] / previous[1] > x / y) {
//                         original[dir] = newness;
//                     }
//                 }
//             }
//         }
//         function calculateAspect() {
//             if (!origin.withinAspect(aspect)) {
//                 return origin.minAspect() > aspect ? 'min' : 'max';
//             }
//             return false;
//         }
//     }
// }
// function midpoint(key) {
//     return function (layout) {
//         var dimension = layout[key];
//         return (dimension[1] + dimension[0]) / 2;
//     };
// }
// function intersection(a, b, memo) {
//     var p1 = [midpointWidth(a), midpointHeight(a)];
//     var p2 = [midpointWidth(b), midpointHeight(b)];
//     var slope1 = p1[1] / p1[0];
//     var slope2 = p2[1] / p2[0];
//     var average = Math.sqrt(slope1) * Math.sqrt(slope2);
//     var multi = 1000;
//     var avg = [multi, average * multi];
//     if (slope1 === slope2) {
//         var x = Math.sqrt(p1[0] / slope2) * Math.sqrt(p2[0]);
//         var y = Math.sqrt(p1[1] / slope2) * Math.sqrt(p2[1]);
//         return {
//             x: round(x, -8),
//             y: round(y, -8)
//         };
//     } else {
//         // line(p1[0], p1[1], p2[0], p2[1]);
//         // line(0, 0, s1 * 100, s2 * 100);
//         // A = y2-y1
//         // B = x1-x2
//         // C = A*x1+B*y1
//         // do for 1 and 2
//         var A1 = p2[1] - p1[1];
//         var B1 = p1[0] - p2[0];
//         var C1 = A1 * p1[0] + B1 * p1[1];
//         var A2 = avg[1] - 0;
//         var B2 = 0 - avg[0];
//         var C2 = A2 * 0 + B2 * 0;
//         // double det = A1 * B2 - A2 * B1
//         // if (det == 0) {
//         //     //Lines are parallel
//         // } else {
//         //     double x = (B2*C1 - B1*C2) / det
//         //     double y = (A1*C2 - A2*C1) / det
//         // }
//         var det = (A1 * B2) - (A2 * B1);
//         var X = ((B2 * C1) - (B1 * C2)) / det;
//         var Y = ((A1 * C2) - (A2 * C1)) / det;
//         return {
//             x: round(X, -8),
//             y: round(Y, -8)
//         };
//         // line(0, 0, X * 100, Y * 100);
//     }
// }
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