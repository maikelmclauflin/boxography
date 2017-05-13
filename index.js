var _ = require('debit');
module.exports = function (options_) {
    var options = Object.assign({
        matrixify: matrixify
    }, options_);
    // fill out matrix, since it can be 2 or 4 long
    var matrix = _.map(_.cloneJSON(options.matrix), fillMatrix);
    var compute = options.compute;
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
    var ask_reverse = _.categoricallyCacheable(function (x) {
        return function (y) {
            var id = compute(x, y);
            var list = byWinner(id);
            list.push([x, y]);
            all.push([x, y, id]);
            return id;
        };
    });
    var winner, target;
    var m = matrix.length;
    var borders = {};
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
    var index = 0;
    while (index < m) {
        target = matrix[index];
        index += 1;
        connect(target, matrix.slice(index), ask);
    }
    var tasks = [
        //
    ];
    while (tasks.length) {}
    var cache = ask_reverse.cache;
    return {
        all: all,
        winner: byWinner,
        matrix: turnDecisionsIntoMatrix(cache, options.matrixify),
        points: cache,
        border: borders
    };

    function ask(x, y) {
        return ask_reverse(y, x);
    }
};

function fillMatrix(row) {
    return row.length === 4 ? row : row.concat(row);
}

function slope(x1, y1, x2, y2) {
    return (y2 - y1) / (x2 - x1);
}

function taskme(x1, y1, x2, y2, runner) {
    var previousComputable, filter,
        x = x1,
        y = y1,
        xStart = x,
        yStart = y,
        dx = x2 - x1,
        dy = y2 - y1,
        dxAbs = Math.abs(dx),
        dyAbs = Math.abs(dy),
        slope = dy / dx,
        invertedSlope = 1 / slope,
        slopeIsInfinite = _.isInfinite(slope),
        slopeDir, slopeIncrementer;
    compute(x, y, runner);
    increments = _.noop;
    if (slopeIsInfinite) {
        increments = incrementYOnly(_.clamp(slope, -1, 1));
    } else if (slope === 0) {
        increments = incrementXOnly(1);
    } else if (slope <= 1 && slope >= -1) {
        increments = incrementsBy(1, slope, function () {
            return x + 1 <= x2;
        });
    } else {
        increments = incrementsBy(1 / slope, 1, function () {
            return y + 1 <= y2;
        });
    }
    _.whilst(increments, _.noop);

    function incrementYOnly(dir) {
        return function () {
            compute(x, y, runner);
            return continues();
        };

        function continues() {
            y += dir;
            return y <= y2;
        }
    }

    function incrementXOnly(dir) {
        return function () {
            compute(x, y, runner);
            return continues();
        };

        function continues() {
            x += dir;
            return x <= x2;
        }
    }
    // function incrementYBy1() {
    //     x += invertedSlope;
    //     y += slopeDir;
    //     var computableX = parseInt(x, 10);
    //     // y remains computable
    //     compute(computableX, y, runner);
    // }
    // function incrementXBy1(slope) {
    //     return
    // return function () {
    //     x += slopeDir;
    //     y += slope;
    //     var computableY = parseInt(y, 10);
    //     // y remains computable
    //     compute(x, computableY, runner);
    // };
    // }
    function incrementsBy(xnext, ynext, continues) {
        return function () {
            x += xnext;
            y += ynext;
            compute(x, y, runner);
            return continues();
        };
    }
}

function compute(x, y, runner) {
    runner(x, y);
    // runner(x - 1, y);
    // runner(x + 1, y);
    // runner(x, y - 1);
    // runner(x, y + 1);
    // runner(x - 1, y - 1);
    // runner(x + 1, y + 1);
    // runner(x + 1, y - 1);
    // runner(x - 1, y + 1);
}

function resolveCenter(row) {
    var x1 = row[0],
        y1 = row[1],
        x2 = row[2],
        y2 = row[3],
        avgX = (x1 + x2) / 2,
        avgY = (y1 + y2) / 2;
    return [parseInt(avgX), parseInt(avgY)];
}

function connect(origin_, targets, ask) {
    var origin = resolveCenter(origin_),
        x1 = origin[0],
        y1 = origin[1];
    _.forEach(targets, function (target_) {
        var calculatedSlope, target = resolveCenter(target_),
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
        } else if ((calculatedSlope = slope(x1, y1, x2, y2)) >= -1 && //
            calculatedSlope <= 1) {
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
        taskme(x_1, y_1, x_2, y_2, ask);

        function reverse() {
            x_1 = x2;
            y_1 = y2;
            x_2 = x1;
            y_2 = y1;
        }
    });
}

function matrixify(item) {
    return item;
}

function turnDecisionsIntoMatrix(decisions, matrixify) {
    return _.reduce(decisions, function (memo, object, x_) {
        var x = +x_;
        return _.reduce(object.cache, function (memo, id, y) {
            memo.push(matrixify([x, +y, id]));
            return memo;
        }, memo);
    }, []);
}

function computeFromOrigin(vectors, winner) {
    //
}