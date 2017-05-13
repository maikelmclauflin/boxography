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
    var winner;
    var index = 1;
    var m = matrix.length;
    index = 0;
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
    while (index < m) {
        connect(matrix[index++], matrix.slice(index), ask);
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

function taskme(x1, y1, x2, y2, runner) {
    var previousComputable,
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
    // slopeDir = slopeIsInfinite ? _.clamp(slope, -1, 1) : (slope === 0 ? (x1 > x2 ? -1 : 1) : (slope > 1 && dx > 0 ? -1 : slope > 1 && dx < 0 ? -1 : (slope < 1 && slope > 0 && dx > 0 ? -1 : slope < 1 && slope > 0 && dx > 0 ? -1 : (slope < 1 && slope > 0 && dx < 0 ? 1 : (-1)))));
    // if (x1 > x2 && y1 > y2) {
    //     x = x2;
    //     y = y2;
    // }
    compute(x, y, runner);
    if (slope === 1 || slope === -1) {
        increments = incrementsBy1;
    } else if (slopeIsInfinite) {
        increments = incrementYOnly;
        slopeDir = _.clamp(slope, -1, 1);
    } else if (slope === 0) {
        increments = incrementXOnly;
        slopeDir = x1 > x2 ? -1 : 1;
    } else if (-1 > slope || slope > 1) {
        increments = incrementYBy1;
        // slopeDir = x1 > x2 ? 1 : -1;
        if (x1 > x2) {
            if (y1 > y2) {
                slopeDir = -1;
            } else {
                slopeDir = 1;
                while (x > x2 && y < y2) {
                    increments();
                }
            }
        } else {
            if (y1 > y2) {
                slopeDir = 1;
                x = x2;
                y = y2;
                while (x > x1 && y < y1) {
                    increments();
                }
            } else {
                slopeDir = 1;
                while (x < x2 && y < y2) {
                    increments();
                }
            }
        }
        return;
    } else if (-1 < slope && slope < 1) {
        increments = incrementXBy1;
        if (x1 > x2) {
            if (y1 > y2) {
                slopeDir = 1;
                while (x > x2 && y > y2) {
                    increments();
                }
            } else {
                slopeDir = 1;
                x = x2;
                y = y2;
                while (x < x1 && y > y1) {
                    increments();
                }
            }
        } else {
            if (y1 > y2) {
                slopeDir = 1;
                while (x < x2 && y > y2) {
                    increments();
                }
            } else {
                slopeDir = 1;
                while (x < x2 && y < y2) {
                    increments();
                }
            }
        }
        return;
    }
    // while (dxAbs > Math.abs(xStart - x1) || (dyAbs > Math.abs(yStart - y1))) {
    //     increments();
    // }
    function incrementYOnly() {
        y += slopeDir;
        compute(x, y, runner);
    }

    function incrementXOnly() {
        x += slopeDir;
        compute(x, y, runner);
    }

    function incrementYBy1() {
        x += invertedSlope;
        y += slopeDir;
        var computableX = parseInt(x, 10);
        // y remains computable
        compute(computableX, y, runner);
    }

    function incrementXBy1() {
        x += slopeDir;
        y += slope;
        var computableY = parseInt(y, 10);
        // y remains computable
        compute(x, computableY, runner);
    }

    function incrementsBy1() {
        x += slope;
        y += slope;
        compute(x, y, runner);
    }
}

function compute(x, y, runner) {
    runner(x, y);
    runner(x - 1, y);
    runner(x + 1, y);
    runner(x, y - 1);
    runner(x, y + 1);
    runner(x - 1, y - 1);
    runner(x + 1, y + 1);
    runner(x + 1, y - 1);
    runner(x - 1, y + 1);
}

function connect(origin, targets, ask) {
    var x1 = origin[0];
    var y1 = origin[1];
    _.forEach(targets, function (target) {
        taskme(x1, y1, target[0], target[1], ask);
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