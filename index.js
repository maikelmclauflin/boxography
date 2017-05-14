var _ = require('debit');
module.exports = function (options_, compute) {
    var options = Object.assign({
        matrixify: matrixify
    }, options_);
    // fill out matrix, since it can be 2 or 4 long
    var matrix = _.map(_.cloneJSON(options.matrix), fillMatrix);
    var limits = options.limits || {};
    var all = [];
    var limitX = limits.x;
    var limitY = limits.y;
    var iterationLimit = limits.iterations || 100000000;
    if (!limitX || !limitY) {
        throw new Error({
            message: 'box computations must have a limit'
        });
    }
    var byWinner = _.cacheable(_.returns.array);
    var borderList = [];
    var borderCache = {};
    var ask_reverse = _.categoricallyCacheable(function (x) {
        return function (y) {
            var id = compute(x, y);
            var list = byWinner(id);
            var pointer = [x, y, id];
            list.push(pointer);
            all.push(pointer);
            return pointer;
        };
    });
    var cache = ask.cache = ask_reverse.cache;
    var borderPixelsByWinner = {};
    computeAreas(matrix, ask);
    computeIntersections(matrix, ask, addBorder);
    computeBorders(borderList, ask, addBorder, addBorderPixel);
    return {
        all: all,
        winner: byWinner,
        points: cache,
        border: borderCache,
        borderList: borderList,
        forEach: function (fn) {
            return turnDecisionsIntoMatrix(cache, fn);
        },
        forEachBorder: function (fn) {
            _.forOwn(borderPixelsByWinner, function (opts, id) {
                _.forEach(opts.all, function (coord) {
                    fn(coord);
                });
            });
        }
    };

    function ask(x, y) {
        return ask_reverse(y, x);
    }

    function inTheBox(x, y) {
        return x > 0 && y > 0 > 0 && x <= limitX && y <= limitY;
    }

    function addBorder(x, y, id, bx, by) {
        if (!inTheBox(x, y)) {
            return;
        }
        var coord = [x, y, id, bx, by],
            identifier = coord.join(',');
        if (!borderCache[identifier]) {
            borderCache[identifier] = coord;
            return addBorderPixel.apply(null, coord);
        }
    }

    function addBorderPixel(x, y, id, bx, by) {
        var scopedBorderPixels = borderPixelsByWinner[id] = borderPixelsByWinner[id] || {
                all: [],
                hash: {}
            },
            scopedX = scopedBorderPixels.hash[x] = scopedBorderPixels.hash[x] || {},
            coords = scopedX[y] = scopedX[y] || [],
            coord = [x, y, id, bx, by];
        scopedBorderPixels.all.push(coord);
        coords.push(coord);
        borderList.push(coord);
        return true;
    }
};

function computeBorders(borders, ask, add, addBorder) {
    var target, index = 0;
    while (index < borders.length) {
        compute(borders[index]);
        index++;
    }

    function compute(border) {
        var x = border[0],
            y = border[1],
            id = border[2],
            bx = border[3],
            by = border[4],
            bIsTop = by < y,
            bIsLeft = bx < x,
            bIsRight = bx > x,
            bIsBottom = by > y;
        if (bIsTop || bIsBottom) {
            // if the border is on top or on bottom
            // then we can only move right or left
            computeNext(x + 1, y, x + 1, by, x + 1, by);
            computeNext(x - 1, y, x - 1, by, x - 1, by);
        } else {
            // if the border is on left or on right
            // then we can only move up or down
            computeNext(x, y - 1, bx, y - 1, bx, y - 1);
            computeNext(x, y + 1, bx, y + 1, bx, y + 1);
        }

        function computeNext(x_, y_, bx_, by_, bx__, by__) {
            var nextBorder, nextId = ask(x_, y_)[2];
            if (nextId === id) {
                nextBorder = ask(bx_, by_)[2];
                if (nextBorder === id) {
                    // they are retreating
                    add(bx__, by__, id, bx, by);
                } else {
                    // nothing has changed
                    add(x_, y_, id, bx_, by_);
                }
            } else {
                // end of the line. check back
                add(x, y, id, x_, y_);
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

function computeAreas(matrix, ask) {
    _.forEach(matrix, function (row) {
        var x1 = row[0],
            y1 = row[1],
            x2 = row[2],
            y2 = row[3],
            x, y = y1;
        do {
            x = x1;
            do {
                ask(x, y);
                x += 1;
            } while (x < x2);
            y += 1;
        } while (y < y2);
    });
}

function computeIntersections(matrix, ask, addBorder) {
    var target, index = 0,
        m = matrix.length;
    while (index < m) {
        target = matrix[index];
        index += 1;
        _.forEach(matrix.slice(index), autoTarget);
    }

    function autoTarget(next) {
        connect(target, next, borderTracker);
    }

    function borderTracker(startX, startY) {
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
                addBorder(previous.x, previous.y, previous.id, x, y);
                addBorder(x, y, id, previous.x, previous.y);
            }
            previous.id = id;
            previous.x = x;
            previous.y = y;
            return id;
        }
    }
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
    // increments = _.noop;
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
            runner(parseInt(x, 10), parseInt(y, 10));
            x += xnext;
            y += ynext;
            return continues();
        };
    }
}
// get a close enough center
function resolveCenter(row) {
    var x1 = row[0],
        y1 = row[1],
        x2 = row[2],
        y2 = row[3],
        avgX = (x1 + x2) / 2,
        avgY = (y1 + y2) / 2;
    return [parseInt(avgX), parseInt(avgY)];
}

function connect(origin_, target_, borderTracker) {
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
    return _.reduce(decisions, function (memo, object, x_) {
        var x = +x_;
        return _.reduce(object.cache, function (memo, info, y) {
            memo.push(matrixify([x, +y, info[2]]));
            return memo;
        }, memo);
    }, []);
}

function computeFromOrigin(vectors, winner) {
    //
}