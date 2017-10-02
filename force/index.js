var returnsTrue = require('@timelaps/returns/true');
var map = require('@timelaps/n/map');
var cloneJSON = require('@timelaps/json/clone');
var cacheable = require('@timelaps/fn/cacheable');
var returnsArray = require('@timelaps/returns/array');
var assign = require('@timelaps/object/assign');
var categoricallyCacheable = require('@timelaps/fn/cacheable/categorically');
var forOwn = require('@timelaps/n/for/own');
var forEach = require('@timelaps/n/for/each');
var find = require('@timelaps/array/find');
var toInteger = require('@timelaps/to/integer');
var reduce = require('@timelaps/array/reduce');
var layout = require('@specless/layout');
module.exports = function (compute, options_) {
    var options = assign({
        matrixify: matrixify,
        continues: returnsTrue,
        computeLimits: true,
        layouts: [],
        limits: {
            x: window.innerWidth,
            y: window.innerHeight
        }
    }, options_);
    var computeLimits = options.computeLimits;
    // fill out matrix, since it can be 2 or 4 long
    var matrix = map(cloneJSON(options.matrix || createMatrix(options.layouts, options.limits)), fillMatrix);
    var limits = options.limits || {};
    var all = [];
    var limitX = limits.x;
    var limitY = limits.y;
    var iterations = 0;
    if (!limitX || !limitY) {
        throw new Error({
            message: 'box computations must have a limit'
        });
    }
    var iterationLimit = limits.iterations || ((limitX * limitY));
    var byWinner = cacheable(returnsArray);
    var borderList = [];
    var borderCache = {};
    var ask_reverse = categoricallyCacheable(function (x) {
        return function (y) {
            var id = compute(x, y);
            var list = byWinner(id);
            var pointer = [x, y, id];
            list.push(pointer);
            all.push(pointer);
            iterations += 1;
            if (iterations >= iterationLimit) {
                console.log(all);
                throw new Error({
                    message: 'iteration limit reached'
                });
            }
            return pointer;
        };
    });
    var cache = ask.cache = ask_reverse.cache;
    var borderPixelsByWinner = {};
    var bt = borderTracker(ask, addBorder);
    var result = {
        all: all,
        points: cache,
        counter: 0,
        borderList: borderList,
        winner: byWinner,
        forEach: function (fn) {
            return turnDecisionsIntoMatrix(cache, fn);
        },
        forEachBorder: function (fn) {
            forOwn(borderPixelsByWinner, function (opts, id) {
                forEach(opts.all, function (coord) {
                    fn(coord);
                });
            });
        }
    };
    var limitBt = computeLimits ? borderTracker(function (x, y) {
        var id = ask(x, y);
        addBorderPixel([x, y, id[2]]);
        return id;
    }, addBorder) : bt;
    var finished = find([
        [
            [1, 1],
            [1, limitY]
        ],
        [
            [1, limitY],
            [limitX, limitY]
        ],
        [
            [limitX, limitY],
            [limitX, 1]
        ],
        [
            [limitX, 1],
            [1, 1]
        ]
    ], function (coords) {
        var a = coords[0].concat(coords[0]);
        var b = coords[1].concat(coords[1]);
        return connect(a, b, limitBt, callsContinues, computeLimits);
    });
    if (!finished) {
        finished = computeAreas(matrix, ask, addBorder, callsContinues);
    }
    if (!finished) {
        finished = computeIntersections(matrix, bt, callsContinues);
    }
    result.finished = !!finished;
    return result;

    function callsContinues() {
        return options.continues(borderPixelsByWinner);
    }

    function ask(x, y) {
        return ask_reverse(y, x);
    }

    function inTheBox(x, y) {
        return x > 0 && y > 0 > 0 && x <= limitX && y <= limitY;
    }

    function emptyTaskQueue() {
        return computeBorders(result, borderList, ask, addBorders, addSingleBorder, addBorderPixel);
    }

    function addBorder(x, y, id, bx, by, bid) {
        addBorders(x, y, id, bx, by, bid);
        emptyTaskQueue();
    }

    function addBorders(x, y, id, bx, by, bid) {
        addSingleBorder(x, y, id, bx, by, bid);
        addSingleBorder(bx, by, bid, x, y, id);
    }

    function addSingleBorder(x, y, id, bx, by, bid) {
        if (!inTheBox(x, y)) {
            return;
        }
        var coord = [x, y, id, bx, by, bid],
            identifier = coord.join(',');
        if (id !== bid && !borderCache[identifier] && canBeBorder(x, y, bx, by)) {
            borderCache[identifier] = coord;
            return addBorderPixel(coord);
        }
    }

    function addBorderPixel(coord) {
        var x = coord[0],
            y = coord[1],
            id = coord[2],
            bx = coord[3],
            by = coord[4],
            bid = coord[5],
            scopedBorderPixels = borderPixelsByWinner[id] = borderPixelsByWinner[id] || {
                all: [],
                hash: {}
            },
            scopedX = scopedBorderPixels.hash[x] = scopedBorderPixels.hash[x] || {},
            coords = scopedX[y] = scopedX[y] || [];
        scopedBorderPixels.all.push(coord);
        if (canBeBorder(x, y, bx, by)) {
            borderList.push(coord);
        }
        coords.push(coord);
        return true;
    }
};

function createMatrix(layouts, dims) {
    return map(layouts, function (a) {
        return [ //
            layout.min.width(a), layout.min.height(a), //
            layout.max.width(a), layout.max.height(a)
        ];
    }).concat([
        [
            dims.x / 2, dims.y / 2, dims.x / 2, dims.y / 2
        ]
    ]);
}

function canBeBorder(x, y, bx, by) {
    return (x === bx || (x - 1 === bx || x + 1 === bx)) && (y === by || (y - 1 === by || y + 1 === by));
}

function computeBorders(result, borders, ask, addBorder, addSingleBorder, addBorderPixel) {
    var target, index = result.counter;
    while (index < borders.length) {
        compute(borders[index]);
        index++;
    }
    result.counter = index;

    function compute(border) {
        var x = border[0],
            y = border[1],
            id = border[2],
            bx = border[3],
            by = border[4],
            bid = border[5],
            bIsTop = by < y,
            bIsLeft = bx < x,
            bIsRight = bx > x,
            bIsBottom = by > y,
            xplus = x + 1,
            xminus = x - 1,
            yplus = y + 1,
            yminus = y - 1;
        if (bIsTop || bIsBottom) {
            // if the border is on top or on bottom
            // then we can only move right or left
            computeNext(xplus, y, xplus, by, xplus, by);
            computeNext(xminus, y, xminus, by, xminus, by);
        } else {
            // if the border is on left or on right
            // then we can only move up or down
            computeNext(x, yplus, bx, yplus, bx, yplus);
            computeNext(x, yminus, bx, yminus, bx, yminus);
        }

        function computeNext(x_, y_, bx_, by_, x__, y__) {
            var nextBorder, nextId = ask(x_, y_)[2];
            if (nextId === id) {
                nextBorder = ask(bx_, by_)[2];
                if (nextBorder === id) {
                    // they are retreating
                    addBorder(bx_, by_, id, bx, by, bid);
                    // addBorderPixel([x_, y_, id]);
                } else {
                    // nothing has changed
                    addBorder(x_, y_, id, bx_, by_, ask(bx_, by_)[2]);
                }
            } else {
                // end of the line. check back
                addBorder(x, y, id, x_, y_, nextId);
                if ((nextId !== (nextBorder = ask(bx_, by_)[2]))) {
                    addBorder(x_, y_, nextId, bx_, by_, nextBorder);
                }
            }
        }
    }

    function hasComputed(x, y) {
        var xCache, yCache;
        if ((xCache = ask.cache[x])) {
            return xCache[y];
        }
    }
}

function computeAreas(matrix, ask, addBorder, continues) {
    return find(matrix, function (row) {
        var memo, id, id2, x1 = row[0],
            y1 = row[1],
            x2 = row[2],
            y2 = row[3],
            x, y = y1,
            x_ = toInteger((x2 + x1) / 2),
            y_ = toInteger((y2 + y1) / 2),
            primeId = ask(x_, y_)[2];
        if ((memo = find([
                [x_, y_],
                [x_, y_ + 1],
                [x_, y_ - 1],
                [x_ + 1, y_],
                [x_ - 1, y_]
            ], function (coords) {
                var id2, x = coords[0],
                    y = coords[1];
                if (primeId !== (id2 = ask(x, y)[2])) {
                    addBorder(x_, y_, primeId, x, y, id2);
                }
                return !continues();
            }))) {
            return memo;
        }
        do {
            x = x1;
            do {
                id = ask(x, y)[2];
                if (y !== y1) {
                    if (id !== (id2 = ask(x, y - 1)[2])) {
                        addBorder(x, y, id, x, y - 1, id2);
                    }
                }
                if (x !== x1) {
                    if (id !== (id2 = ask(x - 1, y)[2])) {
                        addBorder(x, y, id, x - 1, y, id2);
                    }
                }
                if (!continues()) {
                    return true;
                }
                x += 1;
            } while (x < x2);
            y += 1;
        } while (y < y2);
    });
}

function computeIntersections(matrix, bt, continues) {
    var target, index = 0,
        m = matrix.length;
    if (!continues()) {
        return true;
    }
    while (index < m) {
        target = matrix[index];
        index += 1;
        if (find(matrix.slice(index), autoTarget)) {
            return true;
        }
    }

    function autoTarget(next) {
        return connect(target, next, bt, continues);
    }
}

function borderTracker(ask, addBorder) {
    return function (startX, startY) {
        var previous = {
            x: startX,
            y: startY
        };
        return churn;

        function churn(x, y) {
            var point, id, id1, id2;
            // var borderCacheHash
            if (x !== previous.x && y !== previous.y) {
                if (previous.y < y) {
                    churn(x, y - 1);
                } else {
                    churn(x, y + 1);
                }
            }
            point = ask(x, y);
            id = point[2];
            if (previous.id && previous.id !== id) {
                // border change
                addBorder(previous.x, previous.y, previous.id, x, y, id);
            }
            previous.id = id;
            previous.x = x;
            previous.y = y;
            return id;
        }
    };
}

function fillMatrix(row) {
    return row.length === 4 ? row : row.concat(row);
}

function slope(x1, y1, x2, y2) {
    return (y2 - y1) / (x2 - x1);
}

function taskme(x1, y1, x2, y2, runner) {
    var previousComputable, filter, dy,
        x = x1,
        y = y1,
        slopeValue = slope(x1, y1, x2, y2);
    if (slopeValue === Infinity) {
        return incrementsBy(0, 1, function () {
            return y <= y2;
        });
    } else if (slopeValue === 0) {
        return incrementsBy(1, 0, function () {
            return x <= x2;
        });
    } else if (slopeValue <= 1 && slopeValue >= -1) {
        return incrementsBy(1, slopeValue, function () {
            return x <= x2;
        });
    } else {
        return incrementsBy(1 / slopeValue, 1, function () {
            return y <= y2;
        });
    }

    function incrementsBy(xnext, ynext, continues) {
        return function () {
            runner(toInteger(x), toInteger(y));
            x += xnext;
            y += ynext;
            return continues();
        };
    }
}

function resolveCenter(row) {
    // get a close enough center
    var x1 = row[0],
        y1 = row[1],
        x2 = row[2],
        y2 = row[3],
        avgX = (x1 + x2) / 2,
        avgY = (y1 + y2) / 2;
    return [toInteger(avgX), toInteger(avgY)];
}

function connect(origin_, target_, borderTracker, continues, supress) {
    var calculatedSlope, task, origin = resolveCenter(origin_),
        x1 = origin[0],
        y1 = origin[1],
        target = resolveCenter(target_),
        x2 = target[0],
        y2 = target[1],
        x_1 = x1,
        y_1 = y1,
        x_2 = x2,
        y_2 = y2;
    if (x2 === x1) {
        if (y2 < y1) {
            reverse();
        }
    } else if (y2 === y1) {
        if (x2 < x1) {
            reverse();
        }
    } else if ((calculatedSlope = slope(x1, y1, x2, y2)) >= -1 && calculatedSlope <= 1) {
        if (calculatedSlope > 0) {
            if (x2 < x1) {
                reverse();
            }
        } else {
            if (x2 < x1) {
                reverse();
            }
        }
    } else {
        if (calculatedSlope > 1) {
            if (y2 < y1) {
                reverse();
            }
        } else {
            if (y2 < y1) {
                reverse();
            }
        }
    }
    task = taskme(x_1, y_1, x_2, y_2, borderTracker(x_1, y_1));
    while (task()) {}
    if (!supress && !continues()) {
        return true;
    }

    function reverse() {
        x_1 = x2;
        y_1 = y2;
        x_2 = x1;
        y_2 = y1;
    }
}

function matrixify(item) {
    return item;
}

function turnDecisionsIntoMatrix(decisions, matrixify) {
    return reduce(decisions, function (memo, object, x_) {
        var x = +x_;
        return reduce(object.cache, function (memo, info, y) {
            memo.push(matrixify([x, +y, info[2]]));
            return memo;
        }, memo);
    }, []);
}