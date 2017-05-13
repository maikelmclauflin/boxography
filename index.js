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
    var borderList = [];
    var borderCache = {};
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
        _.forEach(matrix.slice(index), autoTarget);
    }

    function autoTarget(next) {
        connect(target, next, borderTracker);
    }
    var tasks = [
        //
    ];
    while (tasks.length) {}
    var cache = ask_reverse.cache;
    return {
        all: all,
        winner: byWinner,
        points: cache,
        border: borderCache,
        forEach: function (fn) {
            return turnDecisionsIntoMatrix(cache, fn);
        }
    };

    function borderTracker(startX, startY) {
        var previous = {
            x: startX,
            y: startY
        };
        return churn;

        function churn(x, y) {
            var id, id1, id2, coords;
            // var borderCacheHash
            if (x !== previous.x && y !== previous.y) {
                if (previous.y < y) {
                    churn(x, y - 1);
                } else {
                    churn(x, y + 1);
                }
            }
            id = ask(x, y);
            if (previous.id && previous.id !== id) {
                // border change
                coords = [
                    [previous.x, previous.y],
                    [x, y]
                ];
                id1 = coords.join(',');
                id2 = [coords[0], coords[1]].join(',');
                if (!borderCache[id1] && !borderCache[id2]) {
                    borderList.push(coords);
                    borderCache[id1] = borderCache[id2] = coords;
                }
            }
            previous.id = id;
            previous.x = x;
            previous.y = y;
            return id;
        }
    }

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

function resolveCenter(row) {
    var x1 = row[0],
        y1 = row[1],
        x2 = row[2],
        y2 = row[3],
        avgX = (x1 + x2) / 2,
        avgY = (y1 + y2) / 2;
    return [parseInt(avgX), parseInt(avgY)];
}

function connect(origin_, target_, ask) {
    var calculatedSlope, origin = resolveCenter(origin_),
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
    var task = taskme(x_1, y_1, x_2, y_2, ask(x_1, y_1));
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
        return _.reduce(object.cache, function (memo, id, y) {
            memo.push(matrixify([x, +y, id]));
            return memo;
        }, memo);
    }, []);
}

function computeFromOrigin(vectors, winner) {
    //
}