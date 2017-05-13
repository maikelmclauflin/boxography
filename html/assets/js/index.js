(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.boxography = require('../../');
},{"../../":2}],2:[function(require,module,exports){
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
},{"debit":137}],3:[function(require,module,exports){
var parse = require('JSON/parse');
var stringify = require('JSON/stringify');
module.exports = function (item) {
    return parse(stringify(item));
};
},{"JSON/parse":5,"JSON/stringify":6}],4:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var first = require('array/first');
var last = require('array/last');
module.exports = function (string) {
    var firstVal = first(string);
    var lastVal = last(string);
    return (isStrictlyEqual(firstVal, '{') && isStrictlyEqual(lastVal, '}')) || (isStrictlyEqual(firstVal, '[') && isStrictlyEqual(lastVal, ']'));
};
},{"array/first":50,"array/last":71,"is/strictly-equal":169}],5:[function(require,module,exports){
module.exports = JSON.parse;
},{}],6:[function(require,module,exports){
module.exports = JSON.stringify;
},{}],7:[function(require,module,exports){
module.exports = {
    'http:': true,
    'https:': true
};
},{}],8:[function(require,module,exports){
var urlToString = require('URL/to-string');
var extraslashes = require('URL/extraslashes');
var indexOf = require('array/index/of');
var find = require('array/find');
module.exports = function (url__, windo_) {
    var filenamesplit, dirname, filename, garbage, href, origin, hostnameSplit, questionable, firstSlash, object, startPath, hostSplit, originNoProtocol, windo = windo_ || window,
        EMPTY_STRING = '',
        COLON = ':',
        SLASH = '/',
        url = url__ || EMPTY_STRING,
        search = EMPTY_STRING,
        hash = EMPTY_STRING,
        host = EMPTY_STRING,
        pathname = EMPTY_STRING,
        port = EMPTY_STRING,
        hostname = EMPTY_STRING,
        searchIdx = indexOf(url, '?') + 1,
        searchObject = {},
        protocolLength = protocols.length,
        doubleSlash = SLASH + SLASH,
        protocolSplit = url.split(COLON),
        location = windo.location || {},
        globalProtocol = location.protocol || '',
        protocol_ = (protocolSplit.length - 1) && (questionable = protocolSplit.shift()),
        protocol = ((protocol_ && find(protocols, function (question) {
            return question === questionable;
        }) || globalProtocol.slice(0, globalProtocol.length - 1))) + COLON;
    if (searchIdx) {
        search = url.slice(searchIdx - 1);
        hash = parseHash_(search);
    } else {
        hash = parseHash_(url);
    }
    if (searchIdx) {
        search = search.split(hash).join(EMPTY_STRING);
        searchObject = parseSearch(search);
        url = url.slice(0, searchIdx - 1);
    }
    if (url[0] === SLASH && url[1] === SLASH) {
        protocol = windo.location.protocol;
    } else {
        while (protocolLength-- && !protocol) {
            if (url.slice(0, protocols[protocolLength].length) === protocols[protocolLength]) {
                protocol = protocols[protocolLength];
            }
        }
        if (!protocol) {
            protocol = HTTP;
        }
    }
    // passed a protocol
    protocolSplit = url.split(COLON);
    if (protocolSplit.length - 1) {
        // protocolSplit
        questionable = protocolSplit.shift();
        hostSplit = protocolSplit.join(COLON).split(SLASH);
        while (!host) {
            host = hostSplit.shift();
        }
        hostnameSplit = host.split(COLON);
        hostname = hostnameSplit.shift();
        port = hostnameSplit.length ? hostnameSplit[0] : EMPTY_STRING;
        garbage = protocolSplit.shift();
        url = protocolSplit.join(COLON).slice(host.length);
    } else {
        host = windo.location.host;
        port = windo.location.port;
        hostname = windo.location.hostname;
    }
    filename = windo.location.pathname;
    filenamesplit = filename.split(SLASH);
    var filenamesplitlength = filenamesplit.length;
    // if it does not end in a slash, pop off the last bit of text
    if (filenamesplit[filenamesplitlength - 1]) {
        filenamesplit[filenamesplitlength - 1] = '';
    }
    dirname = filenamesplit.join(SLASH);
    // handle dot slash
    if (url[0] === PERIOD && url[1] === SLASH) {
        url = url.slice(2);
    }
    if (url[0] === SLASH && url[1] === SLASH) {
        // handle removing host
    }
    // it's already in the format it needs to be in
    if (url[0] === SLASH && url[1] !== SLASH) {
        dirname = EMPTY_STRING;
    }
    pathname = dirname + url;
    origin = protocol + (extraslashes[protocol] ? SLASH + SLASH : EMPTY_STRING) + hostname + (port ? COLON + port : EMPTY_STRING);
    href = origin + pathname + (search || EMPTY_STRING) + (hash || EMPTY_STRING);
    return urlToString({
        passed: url__,
        port: port,
        hostname: hostname,
        pathname: pathname,
        search: search.slice(1),
        host: host,
        hash: hash.slice(1),
        href: href,
        protocol: protocol.slice(0, protocol.length),
        origin: origin,
        searchObject: searchObject
    });
};
},{"URL/extraslashes":7,"URL/to-string":13,"array/find":39,"array/index/of":61}],9:[function(require,module,exports){
var cacheable = require('function/cacheable');
module.exports = cacheable(function (url) {
    return str.split('//').shift();
});
},{"function/cacheable":117}],10:[function(require,module,exports){
var toArray = require('to/array');
module.exports = toArray('http,https,file,about,javascript,ws,tel');
},{"to/array":294}],11:[function(require,module,exports){
var cacheable = require('function/cacheable');
var isString = require('is/string');
module.exports = cacheable(function (str) {
    var match;
    if (!str) {
        return '';
    }
    if (!isString(str)) {
        str = str.referrer;
    }
    if (isString(str)) {
        // gives it a chance to match
        str += '/';
        match = str.match(/^https?:\/\/.*?\//im);
        if (match) {
            match = match[0].slice(0, match[0].length - 1);
        }
    }
    return match || '';
});
},{"function/cacheable":117,"is/string":170}],12:[function(require,module,exports){
var isObject = require('is/object');
var stringify = require('object/stringify');
module.exports = function (obj) {
    var val, n, base = obj,
        query = [];
    if (isObject(obj)) {
        base = obj.url;
        forOwn(obj.query, function (val, n) {
            if (val !== undefined) {
                val = encodeURIComponent(stringify(val));
                query.push(n + '=' + val);
            }
        });
        if (query.length) {
            base += '?';
        }
        base += query.join('&');
        if (obj.hash) {
            obj.hash = isObject(obj.hash) ? encodeURI(stringify(obj.hash)) : hash;
            base += ('#' + obj.hash);
        }
    }
    return base;
};
},{"is/object":164,"object/stringify":231}],13:[function(require,module,exports){
var parseUrl = require('URL/parse');
module.exports = function (object) {
    object.toString = function () {
        return object.href;
    };
    object.replace = function (newlocation) {
        var newparsed = parseUrl(newlocation);
        newparsed.previous = object;
        return newparsed;
    };
    return object;
};
},{"URL/parse":8}],14:[function(require,module,exports){
var isArrayLike = require('is/array-like');
var returnsFirstArgument = require('returns/first');
module.exports = function baseForEach(iterates, forEach, result_) {
    var result = result_ || returnsFirstArgument;
    return function baseForEachIterator(obj_, iteratee_, three, four, five) {
        var wasArrayLike, obj = obj_,
            iteratee = iteratee_;
        if (!obj) {
            return;
        }
        if (!(wasArrayLike = isArrayLike(obj))) {
            iteratee = iterates(obj, iteratee);
            obj = iteratee.keys;
        }
        if (obj.length) {
            return result(forEach(obj, iteratee, three, four, five), obj_, obj, wasArrayLike);
        }
    };
};
},{"is/array-like":139,"returns/first":246}],15:[function(require,module,exports){
var baseForEachEnd = require('array/base/for-each-end');
var lastIndex = require('array/index/last');
var isNil = require('is/nil');
var valueCheck = require('array/base/for-each-value-check');
module.exports = function baseForEachEndRight(list, callback, start, end) {
    return baseForEachEnd(list, callback, isNil(start) ? lastIndex(list) : start, isNil(end) ? 0 : end, -1);
};
},{"array/base/for-each-end":16,"array/base/for-each-value-check":17,"array/index/last":59,"is/nil":160}],16:[function(require,module,exports){
module.exports = baseForEachEnd;
var baseFromToEnd = require('array/base/from-to-end');
var lastIndex = require('array/index/last');
var isNil = require('is/nil');
var valueCheck = require('array/base/for-each-value-check');

function baseForEachEnd(list, iterator, start, stop, step) {
    return baseFromToEnd(list, iterator, isNil(start) ? 0 : start, isNil(stop) ? lastIndex(list) : stop, step || 1);
}
},{"array/base/for-each-value-check":17,"array/base/from-to-end":19,"array/index/last":59,"is/nil":160}],17:[function(require,module,exports){
var isKey = require('is/key');
module.exports = isValue;

function isValue(value) {
    if (isKey(value)) {
        return value;
    }
}
},{"is/key":157}],18:[function(require,module,exports){
var lastIndex = require('array/index/last');
var baseFromTo = require('array/base/from-to');
module.exports = function baseForEach(list, iterator, step_) {
    var greaterThanZero, last, step;
    if (list && iterator) {
        step = step_ || 1;
        last = lastIndex(list);
        return baseFromTo(list, iterator, (greaterThanZero = step > 0) ? 0 : last, greaterThanZero ? last : 0, step);
    }
};
},{"array/base/from-to":20,"array/index/last":59}],19:[function(require,module,exports){
module.exports = function fromToEnd(values, callback, _start, _end, _step) {
    var limit, counter, value, step = _step || 1,
        end = _end,
        start = _start,
        goingDown = step < 0,
        index = start;
    if (goingDown ? start < end : start > end) {
        return -1;
    }
    limit = ((goingDown ? start - end : end - start)) / Math.abs(step || 1);
    for (counter = 0; index >= 0 && counter <= limit; counter++) {
        if (callback(values[index], index, values)) {
            return index;
        }
        index += step;
    }
    return -1;
};
},{}],20:[function(require,module,exports){
var toInteger = require('to/integer');
module.exports = function fromTo(values, runner, _start, _end, step) {
    if (!step) {
        return;
    }
    var goingDown = step < 0,
        end = _end,
        start = _start,
        index = start,
        distance = (goingDown ? start - end : end - start) + 1,
        leftover = distance % 8,
        iterations = toInteger(distance / 8);
    if (leftover > 0) {
        do {
            runner(values[index], index, values);
            index += step;
        } while (--leftover > 0);
    }
    if (iterations) {
        do {
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
            runner(values[index], index, values);
            index += step;
        } while (--iterations > 0);
    }
};
},{"to/integer":299}],21:[function(require,module,exports){
var clamp = require('number/clamp');
var whilst = require('function/whilst');
module.exports = function chunk(array, size) {
    var length, nu = [];
    if (!array || !(length = array.length)) {
        return nu;
    }
    whilst(chunkFilter, chunker, 0);
    return nu;

    function chunkFilter(count) {
        return length > count;
    }

    function chunker(count) {
        var upperLimit = clamp(count + size, 0, length);
        nu.push(array.slice(count, upperLimit));
        return upperLimit;
    }
};
},{"function/whilst":132,"number/clamp":185}],22:[function(require,module,exports){
module.exports = compact;
var filter = require('array/filter');
var isNil = require('is/nil');

function compact(list) {
    return filter(list, isNotNil);
}

function isNotNil(item) {
    return !isNil(item);
}
},{"array/filter":28,"is/nil":160}],23:[function(require,module,exports){
var arrayConcat = [].concat;
module.exports = function concat(list) {
    return arrayConcat.apply([], list);
};
},{}],24:[function(require,module,exports){
var reduce = require('array/reduce');
var indexOf = require('array/index/of');
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function concatUnique(list) {
    return reduce(list, function (memo, argument) {
        return reduce(argument, function (memo, item) {
            if (isStrictlyEqual(indexOf(memo, item), -1)) {
                memo.push(item);
            }
        }, memo);
    }, []);
};
},{"array/index/of":61,"array/reduce":84,"is/strictly-equal":169}],25:[function(require,module,exports){
module.exports = contains;
var isStrictlyEqual = require('is/strictly-equal');
var indexOf = require('array/index/of');

function contains(list, item, start, end) {
    return !isStrictlyEqual(indexOf(list, item, start, end), -1);
}
},{"array/index/of":61,"is/strictly-equal":169}],26:[function(require,module,exports){
module.exports = eq;
var CONSTRUCTOR = 'constructor';
var keys = require('object/keys');
var objectToString = require('function/object-to-string');
var is0 = require('is/0');
var isOf = require('is/of');
var isNil = require('is/nil');
var toNumber = require('to/number');
var createToStringResult = require('to/string-result');
var isStrictlyEqual = require('is/strictly-equal');
var isObject = require('is/object');
var has = require('object/has');
// Internal recursive comparison function for `isEqual`
function eq(a, b, aStack, bStack) {
    var className, areArrays, aCtor, bCtor, length, objKeys, key, aNumber, bNumber;
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (isStrictlyEqual(a, b)) {
        return !isStrictlyEqual(a, 0) || isStrictlyEqual(1 / a, 1 / b);
    }
    // A strict comparison is necessary because `NULL == undefined`.
    if (isNil(a) || isNil(b)) {
        return isStrictlyEqual(a, b);
    }
    // Unwrap any wrapped objects.
    // if (a instanceof _) a = a._wrapped;
    // if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    className = objectToString(a);
    if (!isStrictlyEqual(className, objectToString(b))) {
        return false;
    }
    switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case createToStringResult('RegExp'):
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case createToStringResult('String'):
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return isStrictlyEqual('' + a, '' + b);
    case createToStringResult('Number'):
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        aNumber = toNumber(a);
        bNumber = toNumber(b);
        if (aNumber !== aNumber) {
            return bNumber !== bNumber;
        }
        // An `egal` comparison is performed for other numeric values.
        return is0(aNumber) ? isStrictlyEqual(1 / aNumber, 1 / b) : isStrictlyEqual(aNumber, bNumber);
    case createToStringResult('Date'):
    case createToStringResult('Boolean'):
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return isStrictlyEqual(toNumber(a), toNumber(b));
    }
    areArrays = isStrictlyEqual(className, createToStringResult('Array'));
    if (!areArrays) {
        if (!isObject(a) || !isObject(b)) {
            return false;
        }
        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        aCtor = a[CONSTRUCTOR];
        bCtor = b[CONSTRUCTOR];
        if (aCtor !== bCtor && !(isFunction(aCtor) && isOf(aCtor, aCtor) && isFunction(bCtor) && isOf(bCtor, bCtor)) && (CONSTRUCTOR in a && CONSTRUCTOR in b)) {
            return false;
        }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    // aStack = aStack || [];
    // bStack = bStack || [];
    length = aStack.length;
    while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (isStrictlyEqual(aStack[length], a)) {
            return isStrictlyEqual(bStack[length], b);
        }
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    // Recursively compare objects and arrays.
    if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) {
            return false;
        }
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
            if (!eq(a[length], b[length], aStack, bStack)) {
                return false;
            }
        }
    } else {
        // Deep compare objects.
        objKeys = keys(a);
        length = objKeys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (!isStrictlyEqual(keys(b).length, length)) return false;
        while (length--) {
            // Deep compare each member
            key = objKeys[length];
            if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
}
// // Internal recursive comparison function for `isEqual`.
// function eq(a, b, aStack, bStack) {
//     var className, areArrays, aCtor, bCtor, length, objKeys, key, aNumber, bNumber;
//     // Identical objects are equal. `0 === -0`, but they aren't identical.
//     // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
//     if (a === b) {
//         return a !== 0 || 1 / a === 1 / b;
//     }
//     // A strict comparison is necessary because `NULL == undefined`.
//     if (a === NULL || a === UNDEFINED || b === UNDEFINED || b === NULL) {
//         return a === b;
//     }
//     // Unwrap any wrapped objects.
//     // if (a instanceof _) a = a._wrapped;
//     // if (b instanceof _) b = b._wrapped;
//     // Compare `[[Class]]` names.
//     className = objectToString.call(a);
//     if (className !== objectToString.call(b)) {
//         return BOOLEAN_FALSE;
//     }
//     switch (className) {
//         // Strings, numbers, regular expressions, dates, and booleans are compared by value.
//     case createToStringResult(REG_EXP):
//         // RegExps are coerced to strings for comparison (Note: EMPTY_STRING + /a/i === '/a/i')
//     case createToStringResult(STRING):
//         // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
//         // equivalent to `new String("5")`.
//         return EMPTY_STRING + a === EMPTY_STRING + b;
//     case createToStringResult(NUMBER):
//         // `NaN`s are equivalent, but non-reflexive.
//         // Object(NaN) is equivalent to NaN
//         aNumber = toNumber(a);
//         bNumber = toNumber(b);
//         if (aNumber !== aNumber) {
//             return bNumber !== bNumber;
//         }
//         // An `egal` comparison is performed for other numeric values.
//         return aNumber === 0 ? 1 / aNumber === 1 / b : aNumber === bNumber;
//     case BRACKET_OBJECT_SPACE + 'Date]':
//     case BRACKET_OBJECT_SPACE + 'Boolean]':
//         // Coerce dates and booleans to numeric primitive values. Dates are compared by their
//         // millisecond representations. Note that invalid dates with millisecond representations
//         // of `NaN` are not equivalent.
//         return toNumber(a) === toNumber(b);
//     }
//     areArrays = className === BRACKET_OBJECT_SPACE + 'Array]';
//     if (!areArrays) {
//         if (!isObject(a) || !isObject(b)) {
//             return BOOLEAN_FALSE;
//         }
//         // Objects with different constructors are not equivalent, but `Object`s or `Array`s
//         // from different frames are.
//         aCtor = a[CONSTRUCTOR];
//         bCtor = b[CONSTRUCTOR];
//         if (aCtor !== bCtor && !(isFunction(aCtor) && (aCtor instanceof aCtor) && isFunction(bCtor) && (bCtor instanceof bCtor)) && (CONSTRUCTOR in a && CONSTRUCTOR in b)) {
//             return BOOLEAN_FALSE;
//         }
//     }
//     // Assume equality for cyclic structures. The algorithm for detecting cyclic
//     // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
//     // Initializing stack of traversed objects.
//     // It's done here since we only need them for objects and arrays comparison.
//     // aStack = aStack || [];
//     // bStack = bStack || [];
//     length = aStack[LENGTH];
//     while (length--) {
//         // Linear search. Performance is inversely proportional to the number of
//         // unique nested structures.
//         if (aStack[length] === a) {
//             return bStack[length] === b;
//         }
//     }
//     // Add the first object to the stack of traversed objects.
//     aStack.push(a);
//     bStack.push(b);
//     // Recursively compare objects and arrays.
//     if (areArrays) {
//         // Compare array lengths to determine if a deep comparison is necessary.
//         length = a[LENGTH];
//         if (length !== b[LENGTH]) {
//             return BOOLEAN_FALSE;
//         }
//         // Deep compare the contents, ignoring non-numeric properties.
//         while (length--) {
//             if (!eq(a[length], b[length], aStack, bStack)) {
//                 return BOOLEAN_FALSE;
//             }
//         }
//     } else {
//         // Deep compare objects.
//         objKeys = keys(a);
//         length = objKeys[LENGTH];
//         // Ensure that both objects contain the same number of properties before comparing deep equality.
//         if (keys(b)[LENGTH] !== length) return BOOLEAN_FALSE;
//         while (length--) {
//             // Deep compare each member
//             key = objKeys[length];
//             if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return BOOLEAN_FALSE;
//         }
//     }
//     // Remove the first object from the stack of traversed objects.
//     aStack.pop();
//     bStack.pop();
//     return BOOLEAN_TRUE;
// }
},{"function/object-to-string":127,"is/0":138,"is/nil":160,"is/object":164,"is/of":165,"is/strictly-equal":169,"object/has":211,"object/keys":218,"to/number":302,"to/string-result":305}],27:[function(require,module,exports){
var matchesBinary = require('object/matches/binary');
module.exports = function commonFilter(memo, passed) {
    return function filter(thing, bound, negated, reduction) {
        var negative = !negated;
        return reduction(thing, function (memo, item, index, list) {
            if (matchesBinary(bound(item, index, list), negative)) {
                passed(memo, item, index);
            }
        }, memo());
    };
};
},{"object/matches/binary":220}],28:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
var filterMaker = require('array/filter/maker');
var reduce = require('array/reduce');
module.exports = secondToIterable(filterMaker(reduce));
},{"array/filter/maker":29,"array/reduce":84,"function/convert-second-to-iterable":119}],29:[function(require,module,exports){
var stringConcat = require('string/concat');
var returnsEmptyString = require('returns/empty-string');
var objectSet = require('object/set');
var returnsObject = require('returns/object');
var returnsArray = require('returns/array');
var arrayPush = require('array/push');
var filterCommon = require('array/filter/common');
var negatableFilter = require('array/filter/negatable');
module.exports = negatableFilter(filterCommon(returnsArray, function (array, item) {
    return array.push(item);
}), filterCommon(returnsObject, objectSet), filterCommon(returnsEmptyString, stringConcat));
},{"array/filter/common":27,"array/filter/negatable":30,"array/push":83,"object/set":230,"returns/array":242,"returns/empty-string":244,"returns/object":249,"string/concat":262}],30:[function(require,module,exports){
var isArrayLike = require('is/array-like');
var isObject = require('is/object');
var toIterable = require('to/iterable');
module.exports = function negatableFilter(array, object, string) {
    return function negatableFilterReducer(reduction, negation) {
        return function negatableFilterIterator(thing, iteratee) {
            return (isArrayLike(thing) ? array : (isObject(thing) ? object : string))(thing, toIterable(iteratee), negation, reduction);
        };
    };
};
},{"is/array-like":139,"is/object":164,"to/iterable":300}],31:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
var filterMaker = require('array/filter/maker');
var reduce = require('array/reduce/right');
module.exports = secondToIterable(filterMaker(reduce, true));
},{"array/filter/maker":29,"array/reduce/right":88,"function/convert-second-to-iterable":119}],32:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
var filterMaker = require('array/filter/maker');
var reduce = require('array/reduce');
module.exports = secondToIterable(filterMaker(reduce, true));
},{"array/filter/maker":29,"array/reduce":84,"function/convert-second-to-iterable":119}],33:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
var filterMaker = require('array/filter/maker');
var reduce = require('array/reduce/right');
module.exports = secondToIterable(filterMaker(reduce));
},{"array/filter/maker":29,"array/reduce/right":88,"function/convert-second-to-iterable":119}],34:[function(require,module,exports){
var isNil = require('is/nil');
module.exports = function accessObjectAfter(result, original, iterated, wasArrayLike) {
    return isNil(result) ? result : (wasArrayLike ? original[result] : original[iterated[result]]);
};
},{"is/nil":160}],35:[function(require,module,exports){
var isNil = require('is/nil');
module.exports = function accessObjectKeyAfter(result, original, iterated, wasArrayLike) {
    return isNil(result) ? result : (wasArrayLike ? result : iterated[result]);
};
},{"is/nil":160}],36:[function(require,module,exports){
var isNil = require('is/nil');
module.exports = function accessorCurry(fn) {
    return function accessor(object, callback, start, end) {
        var foundAt;
        if (!isNil(foundAt = fn(object, callback, start, end))) {
            return object[foundAt];
        }
    };
};
},{"is/nil":160}],37:[function(require,module,exports){
var accessObjectAfter = require('array/find/access-object-after'),
    baseEach = require('array/base/each'),
    iterateIn = require('iterate/in'),
    forEachEndRight = require('array/base/for-each-end-right'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateIn, forEachEndRight, accessObjectAfter));
},{"array/base/each":14,"array/base/for-each-end-right":15,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/in":180}],38:[function(require,module,exports){
var accessObjectAfter = require('array/find/access-object-after'),
    baseEach = require('array/base/each'),
    iterateIn = require('iterate/in'),
    forEachEnd = require('array/base/for-each-end'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateIn, forEachEnd, accessObjectAfter));
},{"array/base/each":14,"array/base/for-each-end":16,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/in":180}],39:[function(require,module,exports){
var accessor = require('array/find/accessor'),
    forEachEnd = require('array/base/for-each-end'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(accessor(forEachEnd));
},{"array/base/for-each-end":16,"array/find/accessor":36,"function/convert-second-to-iterable":119}],40:[function(require,module,exports){
var baseEach = require('array/base/each'),
    iterateIn = require('iterate/in'),
    findKeyRight = require('array/find/key/right'),
    accessObjectKeyAfter = require('array/find/access-object-key-after'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateIn, findKeyRight, accessObjectKeyAfter));
},{"array/base/each":14,"array/find/access-object-key-after":35,"array/find/key/right":45,"function/convert-second-to-iterable":119,"iterate/in":180}],41:[function(require,module,exports){
var baseEach = require('array/base/each'),
    iterateIn = require('iterate/in'),
    forEachEnd = require('array/base/for-each-end'),
    accessObjectKeyAfter = require('array/find/access-object-key-after'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateIn, forEachEnd, accessObjectKeyAfter));
},{"array/base/each":14,"array/base/for-each-end":16,"array/find/access-object-key-after":35,"function/convert-second-to-iterable":119,"iterate/in":180}],42:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
var valueCheck = require('array/base/for-each-value-check');
var iterable = secondToIterable(require('array/base/for-each-end'));
module.exports = function (a, b) {
    return valueCheck(iterable(a, b));
};
},{"array/base/for-each-end":16,"array/base/for-each-value-check":17,"function/convert-second-to-iterable":119}],43:[function(require,module,exports){
var baseEach = require('array/base/each'),
    iterateOwn = require('iterate/own'),
    forEachEndRight = require('array/base/for-each-end-right'),
    accessObjectKeyAfter = require('array/find/access-object-after'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateOwn, forEachEndRight, accessObjectKeyAfter));
},{"array/base/each":14,"array/base/for-each-end-right":15,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/own":183}],44:[function(require,module,exports){
var baseEach = require('array/base/each'),
    iterateIn = require('iterate/own'),
    forEachEnd = require('array/base/for-each-end'),
    accessObjectKeyAfter = require('array/find/access-object-after'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateIn, forEachEnd, accessObjectKeyAfter));
},{"array/base/each":14,"array/base/for-each-end":16,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/own":183}],45:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable'),
    forEachEndRight = require('array/base/for-each-end-right'),
    valueCheck = require('array/base/for-each-value-check'),
    iterable = secondToIterable(forEachEndRight);
module.exports = function (a, b) {
    return valueCheck(iterable(a, b));
};
},{"array/base/for-each-end-right":15,"array/base/for-each-value-check":17,"function/convert-second-to-iterable":119}],46:[function(require,module,exports){
var accessObjectAfter = require('array/find/access-object-after'),
    baseEach = require('array/base/each'),
    iterateOwn = require('iterate/own'),
    forEachEndRight = require('array/base/for-each-end-right'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateOwn, forEachEndRight, accessObjectAfter));
},{"array/base/each":14,"array/base/for-each-end-right":15,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/own":183}],47:[function(require,module,exports){
var accessObjectAfter = require('array/find/access-object-after'),
    baseEach = require('array/base/each'),
    iterateOwn = require('iterate/own'),
    forEachEnd = require('array/base/for-each-end'),
    secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(baseEach(iterateOwn, forEachEnd, accessObjectAfter));
},{"array/base/each":14,"array/base/for-each-end":16,"array/find/access-object-after":34,"function/convert-second-to-iterable":119,"iterate/own":183}],48:[function(require,module,exports){
var secondToIterable = require('function/convert-second-to-iterable');
module.exports = secondToIterable(require('array/find/accessor')(require('array/base/for-each-end-right')));
},{"array/base/for-each-end-right":15,"array/find/accessor":36,"function/convert-second-to-iterable":119}],49:[function(require,module,exports){
module.exports = firstIs;
var nthIs = require('array/nth-is');

function firstIs(array, final) {
    return nthIs(array, final, 0);
}
},{"array/nth-is":81}],50:[function(require,module,exports){
var nth = require('array/nth');
module.exports = function first(array) {
    return nth(array, 0);
};
},{"array/nth":82}],51:[function(require,module,exports){
var flattens = require('array/flatten/worker');
var isArrayLike = require('is/array-like');
module.exports = flattenDeep;

function flattenDeep(list) {
    return flattens(list, isArrayLike, flattenDeep);
};
},{"array/flatten/worker":54,"is/array-like":139}],52:[function(require,module,exports){
var toArray = require('to/array');
var flattens = require('array/flatten/worker');
var isArrayLike = require('is/array-like');
module.exports = function flatten(list) {
    return flattens(list, isArrayLike, toArray);
};
},{"array/flatten/worker":54,"is/array-like":139,"to/array":294}],53:[function(require,module,exports){
var toFunction = require('to/function');
var flattens = require('array/flatten/worker');
var isArrayLike = require('is/array-like');
module.exports = flattenSelectively;

function flattenSelectively(list, filter) {
    return flattens(list, toFunction(filter), flattenSelectively);
}
},{"array/flatten/worker":54,"is/array-like":139,"to/function":297}],54:[function(require,module,exports){
var reduce = require('array/reduce');
module.exports = flattenWorker;

function flattenWorker(list, filter, next) {
    return reduce(list, function (memo, item) {
        if (filter(item)) {
            return memo.concat(next(item, filter, next));
        } else {
            memo.push(item);
            return memo;
        }
    }, []);
};
},{"array/reduce":84}],55:[function(require,module,exports){
var baseForEach = require('array/base/for-each');
module.exports = function forEachRight(list, iterator) {
    return baseForEach(list, iterator, -1);
};
},{"array/base/for-each":18}],56:[function(require,module,exports){
var baseForEach = require('array/base/for-each');
module.exports = function forEach(list, iterator) {
    return baseForEach(list, iterator, 1);
};
},{"array/base/for-each":18}],57:[function(require,module,exports){
module.exports = gather;
var concat = require('array/concat');
var map = require('array/map');
var isFunction = require('is/function');

function gather(list, handler) {
    return concat(isFunction(handler) ? map(list, handler) : list);
}
},{"array/concat":23,"array/map":72,"is/function":150}],58:[function(require,module,exports){
module.exports = dropRight;
var slice = require('array/slice');
var defaultTo = require('default-to');

function dropRight(array, _n) {
    return slice(array, 0, defaultTo(_n, array.length - 1));
}
},{"array/slice":90,"default-to":107}],59:[function(require,module,exports){
var access = require('object/get');
module.exports = function lastIndex(array) {
    return access(array, 'length') - 1;
};
},{"object/get":210}],60:[function(require,module,exports){
module.exports = baseIndexOf;
var indexOfNaN = require('array/index/of/nan'),
    isNan = require('is/nan'),
    isStrictlyEqual = require('is/strictly-equal');

function baseIndexOf(checkFullArray, exposure_, filter_, alternative_) {
    var filter = filter_ || isNan,
        alternative = alternative_ || indexOfNaN,
        exposure = exposure_ || isStrictlyEqual;
    return function (array, value, fromIndex, toIndex, fromRight) {
        var index, limit, incrementor;
        if (!array) {
            return -1;
        } else if (filter(value)) {
            return alternative(array, fromIndex, toIndex);
        } else {
            return checkFullArray(array, comparator, fromIndex, toIndex);
        }

        function comparator(item) {
            return exposure(value, item);
        }
    };
}
},{"array/index/of/nan":63,"is/nan":159,"is/strictly-equal":169}],61:[function(require,module,exports){
var baseIndexOf = require('array/index/of/base'),
    forEachEnd = require('array/base/for-each-end');
module.exports = baseIndexOf(forEachEnd);
},{"array/base/for-each-end":16,"array/index/of/base":60}],62:[function(require,module,exports){
var isNan = require('is/nan');
var forEachEndRight = require('array/base/for-each-end-right');
module.exports = indexOfNaN;

function indexOfNaN(array, fromIndex, toIndex) {
    return forEachEndRight(array, isNan, fromIndex, toIndex);
}
},{"array/base/for-each-end-right":15,"is/nan":159}],63:[function(require,module,exports){
var isNan = require('is/nan');
var forEachEnd = require('array/base/for-each-end');
module.exports = function indexOfNaN(array, fromIndex, toIndex) {
    return forEachEnd(array, isNan, fromIndex, toIndex);
};
},{"array/base/for-each-end":16,"is/nan":159}],64:[function(require,module,exports){
var baseIndexOf = require('array/index/of/base'),
    forEachEndRight = require('array/base/for-each-end-right');
module.exports = baseIndexOf(forEachEndRight);
},{"array/base/for-each-end-right":15,"array/index/of/base":60}],65:[function(require,module,exports){
module.exports = smartIndexOf;
var sortedIndexOf = require('array/index/of/sorted'),
    indexOf = require('array/index/of'),
    isTrue = require('is/true');

function smartIndexOf(array, item, _from, _to) {
    return (array && array.length > 100 ? sortedIndexOf : indexOf)(array, item, _from, _to);
}
},{"array/index/of":61,"array/index/of/sorted":66,"is/true":173}],66:[function(require,module,exports){
module.exports = sortedIndexOf;
var TWO_TO_THE_31 = 2147483647,
    indexOfNaN = require('array/index/of/nan'),
    lastIndex = require('array/index/last');

function sortedIndexOf(list, item, minIndex_, maxIndex_) {
    var guess, min = minIndex_ || 0,
        max = maxIndex_ || lastIndex(list),
        bitwise = (max <= TWO_TO_THE_31) ? true : false;
    if (item !== item) {
        return indexOfNaN(list, min, max);
    }
    if (bitwise) {
        while (min <= max) {
            guess = (min + max) >> 1;
            if (list[guess] === item) {
                return guess;
            } else {
                if (list[guess] < item) {
                    min = guess + 1;
                } else {
                    max = guess - 1;
                }
            }
        }
    } else {
        while (min <= max) {
            guess = (min + max) / 2 | 0;
            if (list[guess] === item) {
                return guess;
            } else {
                if (list[guess] < item) {
                    min = guess + 1;
                } else {
                    max = guess - 1;
                }
            }
        }
    }
    return -1;
};
},{"array/index/last":59,"array/index/of/nan":63}],67:[function(require,module,exports){
module.exports = possibleIndex;
var MAX_ARRAY_INDEX = require('number/max-array-index');
var clamp = require('number/clamp');

function possibleIndex(n) {
    return clamp(n, 0, MAX_ARRAY_INDEX);
}
},{"number/clamp":185,"number/max-array-index":191}],68:[function(require,module,exports){
module.exports = itemIs;
var isStrictlyEqual = require('is/strictly-equal');

function itemIs(list, item, index) {
    return isStrictlyEqual(list[index || 0], item);
}
},{"is/strictly-equal":169}],69:[function(require,module,exports){
module.exports = join;
var toArray = require('to/array');
var defaultTo = require('default-to');

function join(array, delimiter) {
    return toArray(array).join(defaultTo(delimiter, ','));
}
},{"default-to":107,"to/array":294}],70:[function(require,module,exports){
module.exports = lastIs;
var lastIndex = require('array/index/last');
var nthIs = require('array/nth-is');

function lastIs(array, final) {
    return nthIs(array, final, lastIndex(array));
}
},{"array/index/last":59,"array/nth-is":81}],71:[function(require,module,exports){
module.exports = last;
var lastIndex = require('array/index/last');
var nth = require('array/nth');

function last(array) {
    return nth(array, lastIndex(array));
}
},{"array/index/last":59,"array/nth":82}],72:[function(require,module,exports){
module.exports = require('array/map/maker')(require('array/for/each'), require('array/map/values-iteratee'), require('returns/array'));
},{"array/for/each":56,"array/map/maker":76,"array/map/values-iteratee":78,"returns/array":242}],73:[function(require,module,exports){
var objectSet = require('object/set');
module.exports = function iterateKeys(collection, bound) {
    return function keysRunner(item, index, objs) {
        objectSet(collection, item, bound(item, index, objs));
    };
};
},{"object/set":230}],74:[function(require,module,exports){
module.exports = require('array/map/maker')(require('object/for-own-right'), require('array/map/keys-iteratee'), require('returns/base-type'));
},{"array/map/keys-iteratee":73,"array/map/maker":76,"object/for-own-right":207,"returns/base-type":243}],75:[function(require,module,exports){
module.exports = require('array/map/maker')(require('object/for-own'), require('array/map/keys-iteratee'), require('returns/base-type'));
},{"array/map/keys-iteratee":73,"array/map/maker":76,"object/for-own":208,"returns/base-type":243}],76:[function(require,module,exports){
var isEmptyArray = require('is/empty-array');
var isString = require('is/string');
module.exports = function mapMaker(iterator, iterable, returnBaseType) {
    return function curriedMap(objs, iteratee) {
        var collection = returnBaseType(objs),
            iterates = isString(iteratee) ? whenString(iteratee) : iteratee;
        if (objs) {
            iterator(objs, iterable(collection, iterates, isEmptyArray(collection)));
        }
        return collection;
    };

    function whenString(iteratee) {
        return function (item) {
            return item[iteratee];
        };
    }
};
},{"is/empty-array":144,"is/string":170}],77:[function(require,module,exports){
module.exports = require('array/map/maker')(require('array/for/each-right'), require('array/map/values-iteratee'), require('returns/array'));
},{"array/for/each-right":55,"array/map/maker":76,"array/map/values-iteratee":78,"returns/array":242}],78:[function(require,module,exports){
// var addArray = require('array/push');
var objectSet = require('object/set');
module.exports = function (collection, bound, empty) {
    return empty ? function (item, index, objs) {
        collection.push(bound(item, index, objs));
    } : function (item, key, objs) {
        objectSet(collection, bound(item, key, objs), key);
    };
};
},{"object/set":230}],79:[function(require,module,exports){
module.exports = require('array/map/maker')(require('object/for-own-right'), require('array/map/values-iteratee'), require('returns/base-type'));
},{"array/map/maker":76,"array/map/values-iteratee":78,"object/for-own-right":207,"returns/base-type":243}],80:[function(require,module,exports){
module.exports = require('array/map/maker')(require('object/for-own'), require('array/map/values-iteratee'), require('returns/base-type'));
},{"array/map/maker":76,"array/map/values-iteratee":78,"object/for-own":208,"returns/base-type":243}],81:[function(require,module,exports){
module.exports = nthIs;
var isStrictlyEqual = require('is/strictly-equal');
var nth = require('array/nth');

function nthIs(array, final, index) {
    return isStrictlyEqual(nth(array, index || 0), final);
}
},{"array/nth":82,"is/strictly-equal":169}],82:[function(require,module,exports){
module.exports = nth;
var isStrictlyEqual = require('is/strictly-equal');
var toNumberCoerce = require('to/number');
var access = require('object/get');

function nth(array, index) {
    var idx = toNumberCoerce(index);
    if (!isStrictlyEqual(idx, -1)) {
        return access(array, idx);
    }
}
},{"is/strictly-equal":169,"object/get":210,"to/number":302}],83:[function(require,module,exports){
module.exports = push;
var arrayPush = [].push;
var toArray = require('to/array');

function push(array, list) {
    return arrayPush.apply(array, toArray(list));
}
},{"to/array":294}],84:[function(require,module,exports){
module.exports = require('array/reduce/make')(1);
},{"array/reduce/make":86}],85:[function(require,module,exports){
var isObject = require('is/object');
var objectKeyGenerator = require('generator/keys');
var isArrayLike = require('is/array-like');
var arrayKeyGenerator = require('generator');
var noop = require('function/noop');
module.exports = function keyGenerator(object, dir, cap, incrementor) {
    return isArrayLike(object) ? arrayKeyGenerator(object, dir, cap, incrementor) : (isObject(object) ? objectKeyGenerator(object, dir, cap, incrementor) : noop);
};
},{"function/noop":126,"generator":135,"generator/keys":136,"is/array-like":139,"is/object":164}],86:[function(require,module,exports){
var reduction = require('array/reduce/reduction');
module.exports = function makeReduce(dir_) {
    return function reducer(obj, iteratee, memo) {
        return reduction(obj, iteratee, memo, dir_, arguments.length < 3);
    };
};
},{"array/reduce/reduction":87}],87:[function(require,module,exports){
var isUndefined = require('is/undefined');
var keyGenerator = require('array/reduce/key-generator');
module.exports = function reduction(accessor, iteratee, memo_, dir, startsAt1) {
    var value, nextMemo, next, memo = memo_,
        generated = keyGenerator(accessor, dir);
    if (startsAt1) {
        if (isUndefined(next = generated())) {
            return memo;
        } else {
            memo = accessor[next];
        }
    }
    while (!isUndefined(next = generated())) {
        if (!isUndefined(nextMemo = iteratee(memo, accessor[next], next, accessor))) {
            memo = nextMemo;
        }
    }
    return memo;
};
},{"array/reduce/key-generator":85,"is/undefined":176}],88:[function(require,module,exports){
module.exports = require('array/reduce/make')(-1);
},{"array/reduce/make":86}],89:[function(require,module,exports){
module.exports = results;
var map = require('array/map');
var result = require('function/result');

function results(array, method, arg) {
    return map(array, resultCaller);

    function resultCaller(item) {
        return result(item, method, arg);
    }
}
},{"array/map":72,"function/result":129}],90:[function(require,module,exports){
module.exports = slice;
var toArray = require('to/array');
var possibleArrayIndex = require('array/index/possible');

function slice(array, start, end) {
    return toArray(array).slice(possibleArrayIndex(start), possibleArrayIndex(end));
}
},{"array/index/possible":67,"to/array":294}],91:[function(require,module,exports){
var isFunction = require('is/function');
var isGreaterThan = require('is/greater-than');
var sort = require('array/sort');
var get = require('object/get');
// arg1 is usually a string or number
module.exports = function sortBy(list, arg1_, handler_, reversed) {
    var arg1 = arg1_,
        handler = handler_ || get;
    if (isFunction(arg1)) {
        handler = arg1;
        arg1 = null;
    }
    return sort(list, function sortByDistillary(a, b) {
        return isGreaterThan(handler(a, arg1), handler(b, arg1));
    }, reversed);
};
},{"array/sort":92,"is/function":150,"is/greater-than":151,"object/get":210}],92:[function(require,module,exports){
var isNan = require('is/nan');
var bindTo = require('function/bind-to');
var defaultSort = require('is/greater-than');
var isTrue = require('is/true');
var isFalse = require('is/false');
module.exports = function sort(obj, fn_, reversed) {
    var fn = bindTo(fn_ || defaultSort, obj);
    // normalize sort function handling for safari
    return obj.slice(0).sort(function comparatorNormalization(a, b) {
        var result = fn(a, b);
        if (isNan(result)) {
            result = Infinity;
        }
        if (isTrue(result)) {
            result = 1;
        }
        if (isFalse(result)) {
            result = -1;
        }
        return reversed ? result * -1 : result;
    });
};
},{"function/bind-to":111,"is/false":147,"is/greater-than":151,"is/nan":159,"is/true":173}],93:[function(require,module,exports){
module.exports = split;
var toString = require('to/string');
var defaultTo = require('default-to');

function split(string, delimiter) {
    return toString(string).split(defaultTo(delimiter, ''));
}
},{"default-to":107,"to/string":306}],94:[function(require,module,exports){
module.exports = tail;
var slice = require('array/slice');
var defaultTo1 = require('default-to/1');

function tail(array, _n) {
    return slice(array, defaultTo1(_n));
}
},{"array/slice":90,"default-to/1":106}],95:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var forEachEndRight = require('array/base/for-each-end-right');
var bindWith = require('function/bind-with');
var isArrayLike = require('is/array-like');
var reduce = require('array/reduce');
module.exports = require('function/convert-second-to-iterable')(uniqueWith);

function uniqueWith(list, comparator) {
    return reduce(list, function uniqueChecker(memo, a, index, list) {
        if (isStrictlyEqual(forEachEndRight(memo, function (b) {
                return comparator(a, b);
            }), -1)) {
            memo.push(a);
        }
    }, []);
}
},{"array/base/for-each-end-right":15,"array/reduce":84,"function/bind-with":112,"function/convert-second-to-iterable":119,"is/array-like":139,"is/strictly-equal":169}],96:[function(require,module,exports){
module.exports = zip;
var reduce = require('array/reduce');
var forEach = require('array/for/each');

function zip(lists) {
    return reduce(lists, function zipReducer(memo, list, listCount) {
        return forEach(list, function zipIterator(item, index) {
            var destination;
            // there is most certainly a more
            // efficient way to do this
            if (!(destination = memo[index])) {
                destination = memo[index] = [];
            }
            destination[listCount] = item;
        });
    }, []);
}
},{"array/for/each":56,"array/reduce":84}],97:[function(require,module,exports){
module.exports = castBoolean;

function castBoolean(item) {
    return !!item;
}
},{}],98:[function(require,module,exports){
module.exports = toggle;
var isUndefined = require('is/undefined');
var castBoolean = require('boolean/cast');

function toggle(current, which) {
    return isUndefined(which) ? !current : castBoolean(which);
}
},{"boolean/cast":97,"is/undefined":176}],99:[function(require,module,exports){
var date = require('date');
var isUndefined = require('is/undefined');
var current = -(date().getTimezoneOffset() / 60);
module.exports = function (zone) {
    current = isUndefined(zone) ? current : zone;
    return current;
};
},{"date":102,"is/undefined":176}],100:[function(require,module,exports){
var parseDatetime = require('date/parse');
var currentZone = require('date/current-zone');
module.exports = function (value) {
    return parseDatetime(value, currentZone());
};
},{"date/current-zone":99,"date/parse":105}],101:[function(require,module,exports){
// module.exports = function defaultDateObject() {
//     return {
//         year: 0,
//         month: 0,
//         date: 0,
//         hour: 0,
//         minute: 0,
//         second: 0,
//         ms: 0,
//         zone: 0
//     };
// };
},{}],102:[function(require,module,exports){
module.exports = date;

function date() {
    return new Date();
}
},{}],103:[function(require,module,exports){
var toNumber = require('to/number');
var date = require('date');
module.exports = dateNumber;

function dateNumber() {
    return toNumber(date());
}
},{"date":102,"to/number":302}],104:[function(require,module,exports){
module.exports = require('date/now')();
},{"date/now":103}],105:[function(require,module,exports){
module.exports = parseDate;
var isString = require('is/string');
var isOf = require('is/of');
var toNumber = require('to/number');
var defaultDatetime = require('date/default');

function parseDate(value_) {
    var value = value_;
    if (!isString(value)) {
        if (isOf(value, Date) && !isNaN(toNumber(value))) {
            value = value.toISOString();
        } else {
            return defaultDatetime();
        }
    }
    return new Date(value);
}
},{"date/default":101,"is/of":165,"is/string":170,"to/number":302}],106:[function(require,module,exports){
var defaultTo = require('default-to');
module.exports = function defaultTo1(n) {
    return defaultTo(n, 1);
};
},{"default-to":107}],107:[function(require,module,exports){
var isUndefined = require('is/undefined');
module.exports = function valueOrDefault(item, def) {
    return isUndefined(item) ? def : item;
};
},{"is/undefined":176}],108:[function(require,module,exports){
var extendConstructor = require('function/extend');
module.exports = extendConstructor.wrapper(Extendable, Object);

function Extendable() {
    return this;
}
},{"function/extend":122}],109:[function(require,module,exports){
var toArray = require('to/array');
module.exports = function defer(fn, time, context) {
    var id;
    return function deferInstance() {
        var context = context || this,
            args = toArray(arguments);
        clearTimeout(id);
        id = setTimeout(function deferTimer() {
            fn.apply(context, args);
        }, time);
        return id;
    };
};
},{"to/array":294}],110:[function(require,module,exports){
var now = require('date/now');
module.exports = function throttle(fn, threshold, scope) {
    var last,
        deferTimer;
    if (!threshold) {
        threshold = 250;
    }
    return function throttleInstance() {
        var context = scope || this,
            _now = now(),
            args = arguments;
        clearTimeout(deferTimer);
        if (last && _now < last + threshold) {
            // hold on to it
            deferTimer = setTimeout(throttled, threshold);
        } else {
            throttled();
        }

        function throttled() {
            last = _now;
            fn.apply(context, args);
        }
    };
};
},{"date/now":103}],111:[function(require,module,exports){
module.exports = bindTo;

function bindTo(func, context) {
    return context ? func.bind(context) : func;
}
},{}],112:[function(require,module,exports){
module.exports = function bindWith(func, args) {
    return func.bind.apply(func, args);
};
},{}],113:[function(require,module,exports){
module.exports = bind;
var toArray = require('to/array');
var bindTo = require('function/bind-to');
var bindWith = require('function/bind-with');

function bind(func, context) {
    return arguments.length < 3 ? bindTo(func, context) : bindWith(func, toArray(arguments).slice(1));
}
},{"function/bind-to":111,"function/bind-with":112,"to/array":294}],114:[function(require,module,exports){
module.exports = blockWrapper;

function blockWrapper(block, context) {
    return 'with(' + (context || 'this') + '){\n' + (block || '') + '\n}';
}
},{}],115:[function(require,module,exports){
var doTry = require('function/do-try');
module.exports = buildCallers;

function buildCallers(prefix, handler, second, memo_) {
    var memo = memo_ || {},
        CALL = 'Call',
        BOUND = 'Bound',
        TRY = 'Try';
    memo[prefix] = handler;
    memo[prefix + CALL] = function (array, method, arg) {
        return handler(array, function (item) {
            return item[method](arg);
        });
    };
    memo[prefix + CALL + BOUND] = function (array, arg) {
        return handler(array, function (fn) {
            return fn(arg);
        });
    };
    memo[prefix + CALL + TRY] = function (array, method, arg, catcher, finallyer) {
        return handler(array, doTry(function (item) {
            return item[method](arg);
        }, catcher, finallyer));
    };
    memo[prefix + CALL + BOUND + TRY] = function (array, method, arg, catcher, finallyer) {
        return handler(array, doTry(function (item) {
            return item(arg);
        }, catcher, finallyer));
    };
    if (second) {
        buildCallers(prefix + 'Right', second, null, memo);
    }
    return memo;
};
},{"function/do-try":120}],116:[function(require,module,exports){
module.exports = categoricallyCachable;
var cacheable = require('function/cacheable');

function categoricallyCachable(fn, baseCategory) {
    var cache = {};
    categoricallyCachableInstance.cache = cache;
    return categoricallyCachableInstance;

    function categoricallyCachableInstance(string, category_) {
        var cacher;
        var category = category_ || baseCategory;
        cacher = cache[category] = cache[category] || cacheable(fn(category));
        return cacher(string);
    }
}
},{"function/cacheable":117}],117:[function(require,module,exports){
var isUndefined = require('is/undefined');
module.exports = cacheable;

function cacheable(fn) {
    var cache = {};
    cacheableInstance.cache = cache;
    return cacheableInstance;

    function cacheableInstance(input) {
        var value;
        if (isUndefined(value = cache[input])) {
            value = cache[input] = fn(input);
        }
        return value;
    }
}
},{"is/undefined":176}],118:[function(require,module,exports){
module.exports = callMethod;

function callMethod(isStr, method, context, argument) {
    return isStr ? context[method](argument) : method.call(context, argument);
}
},{}],119:[function(require,module,exports){
var toIterable = require('to/iterable');
module.exports = function convertSecondToIterable(fn) {
    return function convertsSecondToIterable(a, b, c, d, e, f) {
        return fn(a, toIterable(b), c, d, e, f);
    };
};
},{"to/iterable":300}],120:[function(require,module,exports){
var wraptry = require('function/wrap-try');
module.exports = function doTry(fn, catcher, finallyer) {
    return function doTryIterator(item) {
        return wraptry(function tries() {
            return fn(item);
        }, catcher, finallyer);
    };
};
},{"function/wrap-try":133}],121:[function(require,module,exports){
var keys = require('object/keys');
var values = require('object/values');
var blockWrapper = require('function/block-wrapper');
var isFunction = require('is/function');
var unwrapBlock = require('function/unwrap-block');
module.exports = function evaluate(string_, context, args) {
    var fn, fnstring, string = string_,
        keyz = keys(args),
        valuz = values(args);
    if (isFunction(string_)) {
        string = unwrapBlock(string_);
    }
    fnstring = blockWrapper('"use strict";\nreturn (function(' + keyz.join(', ') + ') {' + (string || '') + '}.apply(this, __args__))');
    fn = new Function.constructor('__args__', fnstring);
    return fn.call(context, valuz);
};
},{"function/block-wrapper":114,"function/unwrap-block":131,"is/function":150,"object/keys":218,"object/values":233}],122:[function(require,module,exports){
var isString = require('is/string');
var merge = require('object/merge');
var has = require('object/has');
var isInstance = require('is/instance');
var factory = require('function/factory');
var bind = require('function/bind');
var PROTOTYPE = 'prototype';
var CONSTRUCTOR = 'constructor';
var FCC = Function[CONSTRUCTOR];
var EXTEND = 'extend';
var isValue = require('is/value');
var DOUBLE_UNDERSCORE = '__';
var COLON = ':';
var toArray = require('to/array');
var isOf = require('is/of');
var bindTo = require('function/bind-to');
var CONSTRUCTOR_KEY = DOUBLE_UNDERSCORE + CONSTRUCTOR + DOUBLE_UNDERSCORE;
var createFrom = require('object/create-from');
constructorExtend.wrapper = constructorWrapper;
module.exports = constructorExtend;

function constructorWrapper(Constructor, notOriginal) {
    __.isInstance = Constructor.isInstance = function (instance) {
        return isInstance(instance, Constructor);
    };
    __.factory = Constructor.factory = factory;
    __.fn = Constructor.fn = Constructor[PROTOTYPE].fn = Constructor[PROTOTYPE];
    __.constructor = Constructor.constructor = Constructor;
    __[EXTEND] = Constructor[EXTEND] = bind(constructorExtend, Constructor);
    __.origin = Constructor.origin = !notOriginal;
    return __;

    function __(one, two, three, four, five, six) {
        return isValue(one) && isOf(one, Constructor) ? one : new Constructor(one, two, three, four, five, six);
    }
}

function constructorExtend(name_, protoProps) {
    var options, nameString, constructorKeyName, child, passedParent, hasConstructor, constructor, parent = this,
        name = name_,
        origin = parent.origin,
        nameIsStr = isString(name);
    if (!nameIsStr) {
        protoProps = name;
        name = null;
    }
    hasConstructor = has(protoProps, CONSTRUCTOR);
    if (protoProps && hasConstructor) {
        child = protoProps[CONSTRUCTOR];
    }
    constructorString = 'return function ' + (name || this.name) + '(){\n\tvar args = [_.bindTo(_.supr, this)].concat(_.toArray(arguments));\n\treturn _.constructor.apply(this, args);\n}';
    // if (nameIsStr) {
    //     child = fcc(constructorString, this, parent);
    // } else {
    // if (child) {
    //     debugger;
    // }
    child = child ? fcc(constructorString, child, parent || this) : this;
    // }
    // child[EXTEND] = constructorExtend;
    var Surrogate = function () {
        this[CONSTRUCTOR] = child;
    };
    Surrogate[PROTOTYPE] = parent[PROTOTYPE];
    child[PROTOTYPE] = merge(createFrom(Surrogate), protoProps);
    // don't call the function if nothing exists
    constructor = child;
    child = constructorWrapper(constructor, 1);
    constructor[PROTOTYPE][CONSTRUCTOR_KEY] = child;
    return child;
}

function fcc(string, child, parent) {
    return new FCC('_', string)({
        toArray: toArray,
        bindTo: bindTo,
        supr: parent,
        constructor: child
    });
}
},{"function/bind":113,"function/bind-to":111,"function/factory":123,"is/instance":155,"is/of":165,"is/string":170,"is/value":178,"object/create-from":202,"object/has":211,"object/merge":223,"to/array":294}],123:[function(require,module,exports){
module.exports = factory;
var toArray = require('to/array');

function factory(name, func_) {
    var func = func_ ? func_ : name;
    var origin = this.origin;
    var extensor = {
        constructor: function (supr) {
            var args = toArray(arguments);
            args = origin ? args : args.slice(1);
            // require('batterie').log(supr);
            return func.apply(this, args);
        }
    };
    var args = func === func_ ? [name, extensor] : [extensor];
    return this.extend.apply(this, args);
}
},{"to/array":294}],124:[function(require,module,exports){
var callMethod = require('function/call-method');
var isString = require('is/string');
module.exports = function flows(fromHere, toHere) {
    var toIsString = isString(toHere),
        fromIsString = isString(fromHere);
    return function flow(arg) {
        return callMethod(toIsString, toHere, this, callMethod(fromIsString, fromHere, this, arg));
    };
};
},{"function/call-method":118,"is/string":170}],125:[function(require,module,exports){
module.exports = function negate(fn) {
    return function negateInstace() {
        return !fn.apply(this, arguments);
    };
};
},{}],126:[function(require,module,exports){
module.exports = function noop() {};
},{}],127:[function(require,module,exports){
var toString = require('object/to-string');
module.exports = function callToString(item) {
    return toString.call(item);
};
},{"object/to-string":232}],128:[function(require,module,exports){
module.exports = function once(fn) {
    var doIt = 1;
    return function onceInstance() {
        if (doIt) {
            doIt = 0;
            return fn.apply(this, arguments);
        }
    };
};
},{}],129:[function(require,module,exports){
var isObject = require('is/object');
var isNil = require('is/nil');
var isFunction = require('is/function');
module.exports = function result(obj, str, arg) {
    return isNil(obj) ? obj : (isFunction(obj[str]) ? obj[str](arg) : (isObject(obj) ? obj[str] : obj));
};
},{"is/function":150,"is/nil":160,"is/object":164}],130:[function(require,module,exports){
module.exports = function reverseParameters(iteratorFn) {
    return function reversesParameters(value, key, third) {
        return iteratorFn(key, value, third);
    };
};
},{}],131:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var lastIndex = require('array/index/last');
module.exports = function unwrapBlock(string_) {
    var string = string_.toString(),
        split = string.split('{'),
        first = split[0],
        trimmed = first && first.trim();
    if (isStrictlyEqual(trimmed.slice(0, 8), 'function')) {
        string = split.shift();
        return (string = split.join('{')).slice(0, lastIndex(string));
    }
    return split.join('{');
};
},{"array/index/last":59,"is/strictly-equal":169}],132:[function(require,module,exports){
module.exports = function whilst(filter, continuation, _memo) {
    var memo = _memo;
    while (filter(memo)) {
        memo = continuation(memo);
    }
    return memo;
};
},{}],133:[function(require,module,exports){
module.exports = function wraptry(trythis, errthat, finalfunction) {
    var returnValue, err = null;
    try {
        returnValue = trythis();
    } catch (e) {
        err = e;
        returnValue = errthat ? errthat(e, returnValue) : returnValue;
    } finally {
        returnValue = finalfunction ? finalfunction(err, returnValue) : returnValue;
    }
    return returnValue;
};
},{}],134:[function(require,module,exports){
var noop = require('function/noop');
module.exports = function wrapper(defaultFn_) {
    var defaultFn = defaultFn_ || noop;
    return function wraps(passnext, passfirst_) {
        var passfirst = passfirst_ || defaultFn;
        return function calls(item, value) {
            return passnext(item, value, function next() {
                return passfirst(item, value);
            });
        };
    };
};
},{"function/noop":126}],135:[function(require,module,exports){
var greaterThanZero = require('number/greater-than/0');
var returnsSecondArgument = require('returns/second');
var returnsFirstArgument = require('returns/first');
module.exports = function arrayGenerator(array, dir_, cap_, incrementor_, transformer_) {
    var previous, dir = dir_ || 1,
        length = array.length,
        counter = dir > 0 ? -1 : length,
        transformer = transformer_ || returnsFirstArgument,
        incrementor = incrementor_ || returnsSecondArgument,
        cap = cap_ || (counter < 0 ? function (counter) {
            return counter >= length;
        } : function (counter) {
            return counter < 0;
        });
    return function generateNext(fn) {
        counter += dir;
        if (cap(counter)) {
            return;
        }
        return transformer(previous = incrementor(previous, counter, array));
    };
};
},{"number/greater-than/0":190,"returns/first":246,"returns/second":251}],136:[function(require,module,exports){
var arrayKeyGenerator = require('generator');
var keys = require('object/keys');
module.exports = function valueGenerator(object, dir, cap, incrementor) {
    var objectKeys = keys(object);
    return arrayKeyGenerator(objectKeys, dir, cap, incrementor, proxy);

    function proxy(value) {
        return objectKeys[value];
    }
};
},{"generator":135,"object/keys":218}],137:[function(require,module,exports){
module.exports = recreate();

function recreate() {
    var FIND = 'find';
    var FIND_KEY = FIND + 'Key';
    var Extendable = require('function/Extendable');
    var buildMethods = require('function/build');
    var isStrictlyEqual = require('is/strictly-equal');
    var merge = require('object/merge');
    var capitalize = require('string/capitalize');
    var mapKeys = require('array/map/keys');
    var returns = require('returns/passed');
    var extend = require('object/extend');
    var forEach = require('array/for/each');
    var forEachRight = require('array/for/each-right');
    var forOwn = require('object/for-own');
    var forOwnRight = require('object/for-own-right');
    var forIn = require('object/for-in');
    var forInRight = require('object/for-in-right');
    var map = require('array/map');
    var mapRight = require('array/map/right');
    var mapValues = require('array/map/values');
    var mapValuesRight = require('array/map/values-right');
    var mapKeysRight = require('array/map/keys-right');
    var find = require('array/find');
    var findRight = require('array/find/right');
    var findIn = require('array/find/in');
    var findInRight = require('array/find/in-right');
    var findOwn = require('array/find/own');
    var findOwnRight = require('array/find/own-right');
    var findKey = require('array/find/key');
    var findKeyIn = require('array/find/key/in');
    var findKeyInRight = require('array/find/key/in-right');
    var findKeyOwn = require('array/find/key/own');
    var findKeyOwnRight = require('array/find/key/own-right');
    var findKeyRight = require('array/find/key/right');
    var reduce = require('array/reduce');
    var reduceRight = require('array/reduce/right');
    var filter = require('array/filter');
    var filterRight = require('array/filter/right');
    var filterNegative = require('array/filter/negative');
    var filterNegativeRight = require('array/filter/negative-right');
    var doTry = require('function/do-try');
    var cases = {
        kebab: require('string/case/kebab'),
        camel: require('string/case/camel'),
        lower: require('string/case/lower'),
        snake: require('string/case/snake'),
        upper: require('string/case/upper')
    };
    var returnsHash = require('returns');
    var to = require('to');
    var is = require('is');
    return extend([{
            Extendable: Extendable,
            recreate: recreate,
            to: to,
            merge: merge,
            case: cases,
            is0: require('is/0'),
            is: merge(isStrictlyEqual, is),
            cacheable: require('function/cacheable'),
            categoricallyCacheable: require('function/cacheable/categorically'),
            castBoolean: require('boolean/cast'),
            nonEnumerableProps: require('object/non-enumerable-props'),
            callObjectToString: require('function/object-to-string'),
            eq: require('array/eq'),
            concat: require('array/concat'),
            concatUnique: require('array/concat/unique'),
            flatten: require('array/flatten'),
            flattenDeep: require('array/flatten/deep'),
            flattenSelectively: require('array/flatten/selectively'),
            lastIndex: require('array/index/last'),
            possibleIndex: require('array/index/possible'),
            indexOf: require('array/index/of'),
            indexOfNan: require('array/index/of/nan'),
            indexOfRight: require('array/index/of/right'),
            indexOfNanRight: require('array/index/of/nan-right'),
            sortedIndexOf: require('array/index/of/sorted'),
            smartIndexOf: require('array/index/of/smart'),
            sort: require('array/sort'),
            sortBy: require('array/sort/by'),
            uniqueWith: require('array/unique/with'),
            console: require('console'),
            chunk: require('array/chunk'),
            compact: require('array/compact'),
            contains: require('array/contains'),
            drop: require('array/tail'),
            dropRight: require('array/head'),
            firstIs: require('array/first-is'),
            first: require('array/first'),
            gather: require('array/gather'),
            head: require('array/head'),
            itemIs: require('array/item-is'),
            join: require('array/join'),
            lastIs: require('array/last-is'),
            last: require('array/last'),
            nthIs: require('array/nth-is'),
            nth: require('array/nth'),
            push: require('array/push'),
            results: require('array/results'),
            slice: require('array/slice'),
            split: require('array/split'),
            zip: require('array/zip'),
            toggle: require('boolean/toggle'),
            dateOffset: require('date/offset'),
            date: require('date'),
            now: require('date/now'),
            dateParse: require('date/current-zone/parse'),
            defaultTo1: require('default-to/1'),
            defer: require('function/async/defer'),
            throttle: require('function/async/throttle'),
            bindTo: require('function/bind-to'),
            bindWith: require('function/bind-with'),
            bind: require('function/bind'),
            evaluate: require('function/evaluate'),
            extendConstructor: require('function/extend'),
            factory: require('function/factory'),
            flows: require('function/flows'),
            once: require('function/once'),
            result: require('function/result'),
            reverseParams: require('function/reverse-params'),
            whilst: require('function/whilst'),
            wrapper: require('function/wrapper'),
            wraptry: require('function/wrap-try'),
            objectGenerator: require('generator/keys'),
            arrayGenerator: require('generator'),
            iterateOverPath: require('iterate/over-path'),
            iterateIn: require('iterate/in'),
            iterateOwn: require('iterate/own'),
            couldBeJSON: require('JSON/could-be'),
            cloneJSON: require('JSON/clone'),
            parseJSON: require('JSON/parse'),
            stringifyJSON: require('JSON/stringify'),
            keys: require('object/keys'),
            allKeys: require('object/keys/all'),
            euclideanDistance: require('number/euclidean-distance'),
            euclideanDistanceOrigin: require('number/euclidean-distance/origin'),
            greaterThan0: require('number/greater-than/0'),
            clamp: require('number/clamp'),
            floatToInteger: require('number/float-to-integer'),
            maxInteger: require('number/max-integer'),
            maxSafeInteger: require('number/max-safe-integer'),
            roundFloat: require('number/round-float'),
            safeInteger: require('number/safe-integer'),
            under1: require('number/under1'),
            withinRange: require('number/within-range'),
            mergeWithDeepCustomizer: require('object/merge/with-deep-customizer'),
            mergeWithShallowCustomizer: require('object/merge/with-shallow-customizer'),
            mergeWith: require('object/merge/with'),
            at: require('object/at'),
            clone: require('object/clone'),
            create: require('object/create'),
            extend: require('object/extend'),
            fromPairs: require('object/from-pairs'),
            get: require('object/get'),
            has: require('object/has'),
            intendedApi: require('object/intended-api'),
            intendedIteration: require('object/intended-iteration'),
            intendedObject: require('object/intended'),
            invert: require('object/invert'),
            set: require('object/set'),
            stringify: require('object/stringify'),
            values: require('object/values'),
            passesFirst: require('passes/first'),
            passesSecond: require('passes/second'),
            performance: require('performance'),
            performanceNow: require('performance/now'),
            returns: merge(returns, returnsHash),
            capitalize: require('string/capitalize'),
            stringConcat: require('string/concat'),
            createEscaper: require('string/create-escaper'),
            objectParse: require('string/object-parse'),
            customUnits: require('string/units/custom'),
            deburr: require('string/deburr'),
            deprefix: require('string/deprefix'),
            hasUnicodeWord: require('string/has-unicode-word'),
            escapeMap: require('string/escape-map'),
            escape: require('string/escape'),
            pad: require('string/pad'),
            padEnd: require('string/pad-end'),
            padStart: require('string/pad-start'),
            unescape: require('string/unescape'),
            unescapeMap: require('string/unescape-map'),
            units: require('string/units'),
            uuid: require('string/uuid'),
            words: require('string/words'),
            time: require('time'),
            indent: require('string/indent'),
            parseURL: require('URL/parse'),
            protocol: require('URL/protocol'),
            protocols: require('URL/protocols'),
            reference: require('URL/reference'),
            stringifyQuery: require('URL/stringify-query'),
            matchesBinary: require('object/matches/binary'),
            matchesProperty: require('object/matches/property'),
            matches: require('object/matches'),
            maxVersion: require('string/max-version'),
            baseDataTypes: require('is/base-data-types'),
            negate: require('function/negate'),
            property: require('object/property'),
            noop: require('function/noop'),
            parse: require('object/parse'),
            type: require('string/type'),
            buildMethods: buildMethods
        },
        mapKeys(is, mapKeysPrefix('is')),
        mapKeys(returnsHash, mapKeysPrefix('returns')),
        mapKeys(to, mapKeysPrefix('to')),
        mapKeys(cases, function (value, key) {
            return key + 'Case';
        }),
        buildMethods('forEach', forEach, forEachRight),
        buildMethods('forOwn', forOwn, forOwnRight),
        buildMethods('forIn', forIn, forInRight),
        buildMethods('map', map, mapRight),
        buildMethods('mapValues', mapValues, mapValuesRight),
        buildMethods('mapKeys', mapKeys, mapKeysRight),
        buildMethods(FIND, find, findRight),
        buildMethods(FIND + 'In', findIn, findInRight),
        buildMethods(FIND + 'Own', findOwn, findOwnRight),
        buildMethods(FIND_KEY, findKey, findKeyRight),
        buildMethods(FIND_KEY + 'Own', findKeyOwn, findKeyOwnRight),
        buildMethods(FIND_KEY + 'In', findKeyIn, findKeyInRight),
        buildMethods('reduce', reduce, reduceRight),
        buildMethods('filter', filter, filterRight),
        buildMethods('filterNegative', filterNegative, filterNegativeRight)
    ]);

    function mapKeysPrefix(prefix) {
        return function (value, key) {
            return prefix + capitalize(key);
        };
    }
}
},{"JSON/clone":3,"JSON/could-be":4,"JSON/parse":5,"JSON/stringify":6,"URL/parse":8,"URL/protocol":9,"URL/protocols":10,"URL/reference":11,"URL/stringify-query":12,"array/chunk":21,"array/compact":22,"array/concat":23,"array/concat/unique":24,"array/contains":25,"array/eq":26,"array/filter":28,"array/filter/negative":32,"array/filter/negative-right":31,"array/filter/right":33,"array/find":39,"array/find/in":38,"array/find/in-right":37,"array/find/key":42,"array/find/key/in":41,"array/find/key/in-right":40,"array/find/key/own":44,"array/find/key/own-right":43,"array/find/key/right":45,"array/find/own":47,"array/find/own-right":46,"array/find/right":48,"array/first":50,"array/first-is":49,"array/flatten":52,"array/flatten/deep":51,"array/flatten/selectively":53,"array/for/each":56,"array/for/each-right":55,"array/gather":57,"array/head":58,"array/index/last":59,"array/index/of":61,"array/index/of/nan":63,"array/index/of/nan-right":62,"array/index/of/right":64,"array/index/of/smart":65,"array/index/of/sorted":66,"array/index/possible":67,"array/item-is":68,"array/join":69,"array/last":71,"array/last-is":70,"array/map":72,"array/map/keys":75,"array/map/keys-right":74,"array/map/right":77,"array/map/values":80,"array/map/values-right":79,"array/nth":82,"array/nth-is":81,"array/push":83,"array/reduce":84,"array/reduce/right":88,"array/results":89,"array/slice":90,"array/sort":92,"array/sort/by":91,"array/split":93,"array/tail":94,"array/unique/with":95,"array/zip":96,"boolean/cast":97,"boolean/toggle":98,"console":308,"date":102,"date/current-zone/parse":100,"date/now":103,"date/offset":104,"default-to/1":106,"function/Extendable":108,"function/async/defer":109,"function/async/throttle":110,"function/bind":113,"function/bind-to":111,"function/bind-with":112,"function/build":115,"function/cacheable":117,"function/cacheable/categorically":116,"function/do-try":120,"function/evaluate":121,"function/extend":122,"function/factory":123,"function/flows":124,"function/negate":125,"function/noop":126,"function/object-to-string":127,"function/once":128,"function/result":129,"function/reverse-params":130,"function/whilst":132,"function/wrap-try":133,"function/wrapper":134,"generator":135,"generator/keys":136,"is":153,"is/0":138,"is/base-data-types":141,"is/strictly-equal":169,"iterate/in":180,"iterate/over-path":182,"iterate/own":183,"number/clamp":185,"number/euclidean-distance":186,"number/euclidean-distance/origin":187,"number/float-to-integer":188,"number/greater-than/0":190,"number/max-integer":192,"number/max-safe-integer":193,"number/round-float":194,"number/safe-integer":195,"number/under1":196,"number/within-range":197,"object/at":198,"object/clone":200,"object/create":203,"object/extend":204,"object/for-in":206,"object/for-in-right":205,"object/for-own":208,"object/for-own-right":207,"object/from-pairs":209,"object/get":210,"object/has":211,"object/intended":214,"object/intended-api":212,"object/intended-iteration":213,"object/invert":215,"object/keys":218,"object/keys/all":216,"object/matches":221,"object/matches/binary":220,"object/matches/property":222,"object/merge":223,"object/merge/with":226,"object/merge/with-deep-customizer":224,"object/merge/with-shallow-customizer":225,"object/non-enumerable-props":227,"object/parse":228,"object/property":229,"object/set":230,"object/stringify":231,"object/values":233,"passes/first":234,"passes/second":235,"performance":236,"performance/now":237,"returns":247,"returns/passed":250,"string/capitalize":256,"string/case/camel":257,"string/case/kebab":258,"string/case/lower":259,"string/case/snake":260,"string/case/upper":261,"string/concat":262,"string/create-escaper":265,"string/deburr":269,"string/deprefix":270,"string/escape":272,"string/escape-map":271,"string/has-unicode-word":273,"string/indent":274,"string/max-version":277,"string/object-parse":278,"string/pad":281,"string/pad-end":279,"string/pad-start":280,"string/type":282,"string/unescape":284,"string/unescape-map":283,"string/units":287,"string/units/custom":286,"string/uuid":289,"string/words":290,"time":293,"to":298}],138:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function is0(value) {
    return isStrictlyEqual(value, 0);
};
},{"is/strictly-equal":169}],139:[function(require,module,exports){
var castBoolean = require('boolean/cast');
var isArray = require('is/array');
var isWindow = require('is/window');
var isString = require('is/string');
var isFunction = require('is/function');
var isNumber = require('is/number');
var MAX_ARRAY_INDEX = require('number/max-array-index');
module.exports = function isArrayLike(collection) {
    var length;
    return isArray(collection) || (isWindow(collection) ? false : (isNumber(length = castBoolean(collection) && collection.length) && !isString(collection) && length >= 0 && length <= MAX_ARRAY_INDEX && !isFunction(collection)));
};
},{"boolean/cast":97,"is/array":140,"is/function":150,"is/number":163,"is/string":170,"is/window":179,"number/max-array-index":191}],140:[function(require,module,exports){
module.exports = Array.isArray;
},{}],141:[function(require,module,exports){
module.exports = {
    true: true,
    false: false,
    null: null,
    undefined: undefined
};
},{}],142:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function isBoolean(argument) {
    return isStrictlyEqual(argument, true) || isStrictlyEqual(argument, false);
};
},{"is/strictly-equal":169}],143:[function(require,module,exports){
var isNil = require('is/nil');
module.exports = function isDefined(value) {
    return !isNil(value);
};
},{"is/nil":160}],144:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var lastIndex = require('array/index/last');
var isArray = require('is/array');
module.exports = function isEmptyArray(array) {
    return isArray(array) && isStrictlyEqual(lastIndex(array), -1);
};
},{"array/index/last":59,"is/array":140,"is/strictly-equal":169}],145:[function(require,module,exports){
var keys = require('object/keys');
module.exports = function isEmpty(obj) {
    return !keys(obj).length;
};
},{"object/keys":218}],146:[function(require,module,exports){
var eq = require('array/eq');
module.exports = function isEqual(a, b) {
    return eq(a, b, [], []);
};
},{"array/eq":26}],147:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function isFalse(item) {
    return isStrictlyEqual(item, false);
};
},{"is/strictly-equal":169}],148:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var castBoolean = require('boolean/cast');
module.exports = function (item) {
    return isStrictlyEqual(castBoolean(item), false);
};
},{"boolean/cast":97,"is/strictly-equal":169}],149:[function(require,module,exports){
var isNumber = require('is/number');
var isInfinite = require('is/infinite');
module.exports = function (value) {
    return isNumber(value) && !isInfinite(value);
};
},{"is/infinite":154,"is/number":163}],150:[function(require,module,exports){
module.exports = require('is/type-wrap')('Function');
},{"is/type-wrap":175}],151:[function(require,module,exports){
module.exports = function (a, b) {
    return a > b;
};
},{}],152:[function(require,module,exports){
var isStrictlyEqual0 = require('is/0');
var HTTP = 'http';
var DOUBLE_SLASH = '//';
var cacheable = require('function/cacheable');
module.exports = cacheable(function isHTTP(str) {
    var ret = false,
        splitLength = str && str.split(DOUBLE_SLASH).length;
    if (splitLength >= 2 && (str.indexOf(HTTP) === 0 || isStrictlyEqual0(str.indexOf(DOUBLE_SLASH)))) {
        ret = true;
    }
    return ret;
});
},{"function/cacheable":117,"is/0":138}],153:[function(require,module,exports){
module.exports = {
    '0': require('is/0'),
    arrayLike: require('is/array-like'),
    array: require('is/array'),
    boolean: require('is/boolean'),
    defined: require('is/defined'),
    emptyArray: require('is/empty-array'),
    empty: require('is/empty'),
    equal: require('is/equal'),
    false: require('is/false'),
    falsey: require('is/falsey'),
    finite: require('is/finite'),
    function: require('is/function'),
    greaterThan: require('is/greater-than'),
    http: require('is/http'),
    infinite: require('is/infinite'),
    instance: require('is/instance'),
    integer: require('is/integer'),
    key: require('is/key'),
    match: require('is/match'),
    nan: require('is/nan'),
    nil: require('is/nil'),
    null: require('is/null'),
    number: require('is/number'),
    object: require('is/object'),
    of: require('is/of'),
    promise: require('is/promise'),
    regExp: require('is/reg-exp'),
    same: require('is/same'),
    strictlyEqual: require('is/strictly-equal'),
    string: require('is/string'),
    symbol: require('is/symbol'),
    thennable: require('is/thennable'),
    true: require('is/true'),
    truthy: require('is/truthy'),
    undefined: require('is/undefined'),
    validInteger: require('is/valid-integer'),
    value: require('is/value'),
    window: require('is/window')
};
},{"is/0":138,"is/array":140,"is/array-like":139,"is/boolean":142,"is/defined":143,"is/empty":145,"is/empty-array":144,"is/equal":146,"is/false":147,"is/falsey":148,"is/finite":149,"is/function":150,"is/greater-than":151,"is/http":152,"is/infinite":154,"is/instance":155,"is/integer":156,"is/key":157,"is/match":158,"is/nan":159,"is/nil":160,"is/null":162,"is/number":163,"is/object":164,"is/of":165,"is/promise":166,"is/reg-exp":167,"is/same":168,"is/strictly-equal":169,"is/string":170,"is/symbol":171,"is/thennable":172,"is/true":173,"is/truthy":174,"is/undefined":176,"is/valid-integer":177,"is/value":178,"is/window":179}],154:[function(require,module,exports){
var INFINITY = Infinity;
var NEGATIVE_INFINITY = -INFINITY;
var isStrictlyEqual = require('is/strictly-equal');
var isNumber = require('is/number');
module.exports = function (value) {
    return isStrictlyEqual(value, INFINITY) || isStrictlyEqual(value, NEGATIVE_INFINITY);
};
},{"is/number":163,"is/strictly-equal":169}],155:[function(require,module,exports){
var isOf = require('is/of');
var has = require('object/has');
var CONSTRUCTOR = 'constructor';
module.exports = function instance(instance, constructor_) {
    var constructor = constructor_;
    if (has(constructor, CONSTRUCTOR)) {
        constructor = constructor[CONSTRUCTOR];
    }
    return isOf(instance, constructor);
};
},{"is/of":165,"object/has":211}],156:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var isFinite = require('is/finite');
module.exports = function (num) {
    return isFinite(num) && isStrictlyEqual(num, Math.round(num));
};
},{"is/finite":149,"is/strictly-equal":169}],157:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var isValue = require('is/value');
var isBoolean = require('is/boolean');
var isString = require('is/string');
var isNumber = require('is/number');
var isInteger = require('is/integer');
module.exports = function (key) {
    // -1 for arrays
    // any other data type ensures string
    return isString(key) || (!isStrictlyEqual(key, -1) && isNumber(key) && isInteger(key));
};
},{"is/boolean":142,"is/integer":156,"is/number":163,"is/strictly-equal":169,"is/string":170,"is/value":178}],158:[function(require,module,exports){
module.exports = match;
var keys = require('object/keys');
var toObject = require('to/object');
var forEachEnd = require('array/base/for-each-end');
var isStrictlyEqual = require('is/strictly-equal');

function match(object, attrs) {
    var key, i = 0,
        keysResult = keys(attrs),
        obj = toObject(object);
    return !(forEachEnd(keysResult, iterates) + 1);

    function iterates(key) {
        return !isStrictlyEqual(attrs[key], obj[key]);
    }
}
},{"array/base/for-each-end":16,"is/strictly-equal":169,"object/keys":218,"to/object":303}],159:[function(require,module,exports){
module.exports = function (item) {
    return item !== item;
};
},{}],160:[function(require,module,exports){
var isUndefined = require('is/undefined');
var isNull = require('is/null');
module.exports = function (value) {
    return isNull(value) || isUndefined(value);
};
},{"is/null":162,"is/undefined":176}],161:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function notNaN(value) {
    return isStrictlyEqual(value, value);
};
},{"is/strictly-equal":169}],162:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (thing) {
    return isStrictlyEqual(thing, null);
};
},{"is/strictly-equal":169}],163:[function(require,module,exports){
module.exports = require('is/type-wrap')('Number', require('function/negate')(require('is/nan')));
},{"function/negate":125,"is/nan":159,"is/type-wrap":175}],164:[function(require,module,exports){
module.exports = require('is/type-wrap')('object', require('boolean/cast'));
},{"boolean/cast":97,"is/type-wrap":175}],165:[function(require,module,exports){
module.exports = function (instance, constructor) {
    return constructor ? instance instanceof constructor : false;
};
},{}],166:[function(require,module,exports){
(function (global){
var isOf = require('is/of');
module.exports = function (promise) {
    return isOf(promise, global.Promise);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"is/of":165}],167:[function(require,module,exports){
var isOf = require('is/of');
module.exports = function (item) {
    return isOf(item, RegExp);
};
},{"is/of":165}],168:[function(require,module,exports){
module.exports = same;

function same(a, b) {
    return a === a ? b === a : b !== b;
}
},{}],169:[function(require,module,exports){
module.exports = function (a, b) {
    return a === b;
};
},{}],170:[function(require,module,exports){
module.exports = require('is/type-wrap')('String');
},{"is/type-wrap":175}],171:[function(require,module,exports){
var SYMBOL = 'symbol';
var isStrictlyEqual = require('is/strictly-equal');
var callObjectToString = require('function/object-to-string');
var createToStringResult = require('to/string-result');
var symbolTag = createToStringResult(SYMBOL);
var isObject = require('is/object');
var isSymbolWrap = require('is/type-wrap')(SYMBOL);
module.exports = function (value) {
    return isSymbolWrap(value) || (isObject(value) && isStrictlyEqual(callObjectToString(value), symbolTag));
};
},{"function/object-to-string":127,"is/object":164,"is/strictly-equal":169,"is/type-wrap":175,"to/string-result":305}],172:[function(require,module,exports){
var castBoolean = require('boolean/cast');
var get = require('object/get');
var isFunction = require('is/function');
module.exports = function (thennable) {
    return isFunction(get(thennable, 'then')) && isFunction(get(thennable, 'catch'));
};
},{"boolean/cast":97,"is/function":150,"object/get":210}],173:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (item) {
    return isStrictlyEqual(item, true);
};
},{"is/strictly-equal":169}],174:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var castBoolean = require('boolean/cast');
module.exports = function (item) {
    return isStrictlyEqual(castBoolean(item), true);
};
},{"boolean/cast":97,"is/strictly-equal":169}],175:[function(require,module,exports){
var type = require('string/type');
var lowerCaseString = require('string/lower-case');
module.exports = function (type_, fn_) {
    var ty = lowerCaseString(type_);
    var fn = fn_ || function () {
        return true;
    };
    return function (thing) {
        return type(thing) === ty && fn(thing);
    };
};
},{"string/lower-case":275,"string/type":282}],176:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (thing) {
    return isStrictlyEqual(thing);
};
},{"is/strictly-equal":169}],177:[function(require,module,exports){
var withinRange = require('number/within-range');
var MAX_INTEGER = require('number/max-integer');
module.exports = function isValidInteger(number) {
    return withinRange(number, -MAX_INTEGER, MAX_INTEGER);
};
},{"number/max-integer":192,"number/within-range":197}],178:[function(require,module,exports){
var isStrictlyEqual = require('is/not-nan');
var isNil = require('is/nil');
var notNan = require('is/not-nan');
module.exports = function (value) {
    return notNan(value) && !isNil(value);
};
},{"is/nil":160,"is/not-nan":161}],179:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (windo) {
    return windo ? isStrictlyEqual(windo, windo.global) : false;
};
},{"is/strictly-equal":169}],180:[function(require,module,exports){
module.exports = require('iterate')(require('object/keys/all'));
},{"iterate":181,"object/keys/all":216}],181:[function(require,module,exports){
module.exports = function (keys) {
    return function (obj, iterator) {
        handler.keys = keys(obj);
        return handler;

        function handler(key, idx, list) {
            // gives you the key, use that to get the value
            return iterator(obj[key], key, obj);
        }
    };
};
},{}],182:[function(require,module,exports){
var lastIs = require('array/last-is');
var toPath = require('to/path');
var isArray = require('is/array');
var head = require('array/head');
var find = require('array/find');
module.exports = function (path, fn, object) {
    var list = path;
    if (!isArray(list)) {
        list = toPath(path);
        // check for extra empty string
        list = lastIs(path, ']') ? head(list) : list;
    }
    return find(list, fn);
};
},{"array/find":39,"array/head":58,"array/last-is":70,"is/array":140,"to/path":304}],183:[function(require,module,exports){
module.exports = require('iterate')(require('object/keys'));
},{"iterate":181,"object/keys":218}],184:[function(require,module,exports){
module.exports = function (number) {
    return Math.ceil(number);
};
},{}],185:[function(require,module,exports){
var isNumber = require('is/number');
module.exports = function (number, lower, upper) {
    return isNumber(number) ? (number < lower ? lower : (number > upper ? upper : number)) : number;
};
},{"is/number":163}],186:[function(require,module,exports){
module.exports = function (x1, y1, x2, y2) {
    var a = x1 - x2,
        b = y1 - y2;
    return Math.sqrt((a * a) + (b * b));
};
},{}],187:[function(require,module,exports){
var euclideanDistance = require('number/euclidean-distance');
module.exports = function (x, y) {
    return euclideanDistance(0, 0, x, y);
};
},{"number/euclidean-distance":186}],188:[function(require,module,exports){
var isNotNan = require('is/not-nan');
module.exports = function (value) {
    var remainder = value % 1;
    return isNotNan(value) ? (remainder ? value - remainder : value) : 0;
};
},{"is/not-nan":161}],189:[function(require,module,exports){
module.exports = function (number) {
    return Math.floor(number);
};
},{}],190:[function(require,module,exports){
var isGreaterThan = require('is/greater-than');
module.exports = function (number) {
    return isGreaterThan(number, 0);
};
},{"is/greater-than":151}],191:[function(require,module,exports){
module.exports = Math.pow(2, 53) - 1;
},{}],192:[function(require,module,exports){
module.exports = 1.7976931348623157e+308;
},{}],193:[function(require,module,exports){
module.exports = 9007199254740991;
},{}],194:[function(require,module,exports){
var round = Math.round;
var isNumber = require('is/number');
module.exports = function (val, power_, base) {
    var mult, power = power_;
    if (!isNumber(power_)) {
        power = 1;
    }
    mult = Math.pow(base || 10, power);
    return (round(mult * val, 10) / mult);
};
},{"is/number":163}],195:[function(require,module,exports){
var clamp = require('number/clamp');
var MAX_SAFE_INTEGER = require('number/max-safe-integer');
var MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;
module.exports = function (number_) {
    return clamp(number_, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER);
};
},{"number/clamp":185,"number/max-safe-integer":193}],196:[function(require,module,exports){
module.exports = function (number) {
    return number > 1 ? 1 / number : number;
};
},{}],197:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var clamp = require('number/clamp');
var isNumber = require('is/number');
module.exports = function (number, min, max) {
    return isNumber(number) && isStrictlyEqual(number, clamp(number, min, max));
};
},{"is/number":163,"is/strictly-equal":169,"number/clamp":185}],198:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
var iterateOverPath = require('iterate/over-path');
var lastIndex = require('array/index/last');
var isNil = require('is/nil');
module.exports = function (object_, path) {
    var result, object = object_ || {};
    iterateOverPath(path, function (accessor, index, list) {
        var value = object[accessor];
        if (isStrictlyEqual(index, lastIndex(list))) {
            result = value;
        } else if (isNil(value)) {
            return true;
        } else {
            object = value;
        }
    });
    return result;
};
},{"array/index/last":59,"is/nil":160,"is/strictly-equal":169,"iterate/over-path":182}],199:[function(require,module,exports){
var isNil = require('is/nil');
module.exports = function (object) {
    var wasNil = isNil(object);
    return propertyOf;

    function propertyOf(key) {
        if (!wasNil) {
            return object[key];
        }
    }
};
},{"is/nil":160}],200:[function(require,module,exports){
var mapValues = require('array/map/values');
var returnsFirst = require('returns/first');
var isObject = require('is/object');
var isNil = require('is/nil');
module.exports = function (obj) {
    return isNil(obj) || !isObject(obj) ? obj : mapValues(obj, returnsFirst);
};
},{"array/map/values":80,"is/nil":160,"is/object":164,"returns/first":246}],201:[function(require,module,exports){
var CONSTRUCTOR = 'constructor';
var has = require('object/has');
var contains = require('array/contains');
var isFunction = require('is/function');
var nonEnumerableProps = require('object/non-enumerable-props');
module.exports = function (obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj[CONSTRUCTOR];
    var proto = (isFunction(constructor) && constructor.prototype) || ObjProto;
    // Constructor is a special case.
    var prop = CONSTRUCTOR;
    if (has(obj, prop) && !contains(keys, prop)) {
        keys.push(prop);
    }
    while (nonEnumIdx--) {
        prop = nonEnumerableProps[nonEnumIdx];
        if (prop in obj && obj[prop] !== proto[prop] && !contains(keys, prop)) {
            keys.push(prop);
        }
    }
};
},{"array/contains":25,"is/function":150,"object/has":211,"object/non-enumerable-props":227}],202:[function(require,module,exports){
module.exports = createFrom;
var merge = require('object/merge');
var create = require('object/create');
var isFunction = require('is/function');

function createFrom(Constrktr) {
    if (isFunction(Constrktr)) {
        return new Constrktr;
    } else {
        return create(Constrktr);
    }
}
},{"is/function":150,"object/create":203,"object/merge":223}],203:[function(require,module,exports){
module.exports = Object.create || (Object.create = (function () {
    var PROTO = '__proto__';
    var TMP = function () {};
    var NULL = null;
    return function (prototype, propertiesObject) {
        if (prototype !== Object(prototype) && prototype !== NULL) {
            throw TypeError('Argument must be an object, or ' + NULL);
        }
        TMP[PROTOTYPE] = prototype || {};
        var result = new TMP();
        TMP[PROTOTYPE] = NULL;
        if (propertiesObject !== UNDEFINED) {
            Object.defineProperties(result, propertiesObject);
        }
        // to imitate the case of Object.create(NULL)
        if (prototype === NULL) {
            result[PROTO] = NULL;
        }
        return result;
    };
})());
},{}],204:[function(require,module,exports){
var merge = require('object/merge');
module.exports = function (args, deep, stack) {
    var length = args && args.length,
        index = 1,
        first = 0,
        base = args ? (args[0] || {}) : base;
    if (base) {
        for (; index < length; index++) {
            merge(base, args[index], deep, stack);
        }
    }
    return base;
};
},{"object/merge":223}],205:[function(require,module,exports){
module.exports = require('array/base/each')(require('iterate/in'), require('array/for/each-right'));
},{"array/base/each":14,"array/for/each-right":55,"iterate/in":180}],206:[function(require,module,exports){
module.exports = require('array/base/each')(require('iterate/in'), require('array/for/each'));
},{"array/base/each":14,"array/for/each":56,"iterate/in":180}],207:[function(require,module,exports){
module.exports = require('array/base/each')(require('iterate/own'), require('array/for/each-right'));
},{"array/base/each":14,"array/for/each-right":55,"iterate/own":183}],208:[function(require,module,exports){
module.exports = require('array/base/each')(require('iterate/own'), require('array/for/each'));
},{"array/base/each":14,"array/for/each":56,"iterate/own":183}],209:[function(require,module,exports){
var forEach = require('array/for/each');
module.exports = function (keys) {
    var obj = {};
    forEach(keys, function (key, index) {
        obj[key[0]] = key[1];
    });
    return obj;
};
},{"array/for/each":56}],210:[function(require,module,exports){
module.exports = function (object, key) {
    return object ? object[key] : undefined;
};
},{}],211:[function(require,module,exports){
var isFunction = require('is/function');
module.exports = function (obj, prop) {
    return obj && isFunction(obj.hasOwnProperty) ? obj.hasOwnProperty(prop) : false;
};
},{"is/function":150}],212:[function(require,module,exports){
var intendedObject = require('object/intended');
var bindTo = require('function/bind-to');
module.exports = function intendedApi(fn) {
    return function (one, two) {
        intendedObject(one, two, bindTo(fn, this));
        return this;
    };
};
},{"function/bind-to":111,"object/intended":214}],213:[function(require,module,exports){
var isObject = require('is/object');
var keys = require('object/keys');
var forEach = require('array/for/each');
module.exports = function (key, value, iterator) {
    var keysResult, isObjectResult = isObject(key);
    if (isObjectResult) {
        keysResult = keys(key);
    }
    return function (one, two, three, four, five, six) {
        if (isObjectResult) {
            forEach(keysResult, function (key_) {
                iterator(key_, key[key_], one, two, three, four, five, six);
            });
        } else {
            iterator(key, value, one, two, three, four, five, six);
        }
    };
};
},{"array/for/each":56,"is/object":164,"object/keys":218}],214:[function(require,module,exports){
var isObject = require('is/object');
var isArray = require('is/array');
var forEach = require('array/for/each');
var reverseParams = require('function/reverse-params');
var forOwn = require('object/for-own');
module.exports = function (key, value, fn) {
    var obj;
    if (isArray(key)) {
        forEach(key, function (first) {
            fn(first, value);
        });
    } else {
        if ((obj = isObject(key) ? key : false)) {
            forOwn(obj, reverseParams(fn));
        } else {
            fn(key, value);
        }
    }
};
},{"array/for/each":56,"function/reverse-params":130,"is/array":140,"is/object":164,"object/for-own":208}],215:[function(require,module,exports){
var keys = require('object/keys');
module.exports = function (obj) {
    var i = 0,
        result = {},
        objKeys = keys(obj),
        length = objKeys.length;
    for (; i < length; i++) {
        result[obj[objKeys[i]]] = objKeys[i];
    }
    return result;
};
},{"object/keys":218}],216:[function(require,module,exports){
var ENUM_BUG = require('object/keys/enum-bug');
var collectNonEnumProps = require('object/collect-non-enum-props');
module.exports = function (obj) {
    var key, keys = [];
    for (key in obj) {
        keys.push(key);
    }
    // Ahem, IE < 9.
    if (ENUM_BUG) {
        collectNonEnumProps(obj, keys);
    }
    return keys;
};
},{"object/collect-non-enum-props":201,"object/keys/enum-bug":217}],217:[function(require,module,exports){
module.exports = !{
    toString: null
}.propertyIsEnumerable('toString');
},{}],218:[function(require,module,exports){
var ENUM_BUG = require('object/keys/enum-bug');
var collectNonEnumProps = require('object/collect-non-enum-props');
var isObject = require('is/object');
var isFunction = require('is/function');
var nativeKeys = require('object/keys/native');
var has = require('object/has');
module.exports = function (obj) {
    var key, keys = [];
    if (!obj || (!isObject(obj) && !isFunction(obj))) {
        return keys;
    }
    if (nativeKeys) {
        return nativeKeys(obj);
    }
    for (key in obj) {
        if (has(obj, key)) {
            keys.push(key);
        }
    }
    // Ahem, IE < 9.
    if (ENUM_BUG) {
        collectNonEnumProps(obj, keys);
    }
    return keys;
};
},{"is/function":150,"is/object":164,"object/collect-non-enum-props":201,"object/has":211,"object/keys/enum-bug":217,"object/keys/native":219}],219:[function(require,module,exports){
module.exports = Object.keys;
},{}],220:[function(require,module,exports){
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (assertment, lookingFor) {
    var boolAssertment = !assertment;
    var boolLookingFor = !lookingFor;
    return isStrictlyEqual(boolAssertment, boolLookingFor);
};
},{"is/strictly-equal":169}],221:[function(require,module,exports){
var isMatch = require('is/match');
module.exports = function (obj1) {
    return function (obj2) {
        return isMatch(obj2, obj1);
    };
};
},{"is/match":158}],222:[function(require,module,exports){
module.exports = property;
var isStrictlyEqual = require('is/strictly-equal');
var get = require('object/get');

function property(pair) {
    var key = pair[0],
        value = pair[1];
    return function (item) {
        return isStrictlyEqual(get(item, key), value);
    };
}
},{"is/strictly-equal":169,"object/get":210}],223:[function(require,module,exports){
var shallowMergeWithCustomizer = require('object/merge/with-deep-customizer');
var mergeWith = require('object/merge/with');
var isBoolean = require('is/boolean');
module.exports = function (obj1, obj2, deep) {
    var customizer = isBoolean[deep] ? (deep ? deepMergeWithCustomizer : shallowMergeWithCustomizer) : deep ? deep : shallowMergeWithCustomizer;
    return mergeWith(obj1, obj2, customizer);
};
},{"is/boolean":142,"object/merge/with":226,"object/merge/with-deep-customizer":224}],224:[function(require,module,exports){
var isObject = require('is/object');
var contains = require('array/contains');
var returnBaseType = require('returns/base-type');
var mergeWith = require('object/merge/with');
module.exports = function deepMergeWithCustomizer(o1Val, o2Val, key, o1, o2, stack) {
    var result, garbage;
    if (isObject(o2Val)) {
        if (contains(stack, o2Val)) {
            return o2Val;
        }
        stack.push(o2Val);
        if (!isObject(o1Val)) {
            o1Val = returnBaseType(o2Val);
        }
        result = mergeWith(o1Val, o2Val, deepMergeWithCustomizer, stack);
        garbage = stack.pop();
        return result;
    } else {
        return o2Val;
    }
};
},{"array/contains":25,"is/object":164,"object/merge/with":226,"returns/base-type":243}],225:[function(require,module,exports){
module.exports = require('returns/second');
},{"returns/second":251}],226:[function(require,module,exports){
var isUndefined = require('is/undefined');
var keys = require('object/keys');
var isStrictlyEqual = require('is/strictly-equal');
module.exports = function (o1, o2, customizer, _stack) {
    var key, o1Val, o2Val, i = 0,
        instanceKeys = keys(o2),
        stack = _stack || [],
        l = instanceKeys.length;
    for (; i < l; i++) {
        key = instanceKeys[i];
        o1Val = o1[key];
        o2Val = o2[key];
        // ignore undefined
        if (!isUndefined(o2[key]) && !isStrictlyEqual(o1Val, o2Val)) {
            o1[key] = customizer(o1Val, o2Val, key, o1, o2, stack);
        }
    }
    return o1;
};
},{"is/strictly-equal":169,"is/undefined":176,"object/keys":218}],227:[function(require,module,exports){
var toArray = require('to/array');
module.exports = toArray('valueOf,isPrototypeOf,propertyIsEnumerable,hasOwnProperty,toLocaleString,toString');
},{"to/array":294}],228:[function(require,module,exports){
var isNotNan = require('is/not-nan');
var isString = require('is/string');
var wraptry = require('function/wrap-try');
var couldBeJSON = require('JSON/could-be');
var JSONParse = require('JSON/parse');
var toNumber = require('to/number');
var has = require('object/has');
var baseDataTypes = require('is/base-data-types');
module.exports = function (val_) {
    var valTrimmed, valLength, coerced, val = val_;
    if (!isString(val)) {
        // already parsed
        return val;
    }
    val = valTrimmed = val.trim();
    valLength = val.length;
    if (!valLength) {
        return val;
    }
    if (couldBeJSON(val)) {
        if ((val = wraptry(function () {
                return JSONParse(val);
            }, function () {
                return val;
            })) !== valTrimmed) {
            return val;
        }
    }
    coerced = toNumber(val);
    if (isNotNan(coerced)) {
        return coerced;
    }
    if (has(baseDataTypes, val)) {
        return baseDataTypes[val];
    }
    if (val.slice(0, 8) === 'function') {
        return new FUNCTION_CONSTRUCTOR_CONSTRUCTOR('return ' + val)();
    }
    return val;
}
},{"JSON/could-be":4,"JSON/parse":5,"function/wrap-try":133,"is/base-data-types":141,"is/not-nan":161,"is/string":170,"object/has":211,"to/number":302}],229:[function(require,module,exports){
var get = require('object/get');
module.exports = function (string) {
    return function (object) {
        return get(object, string);
    };
};
},{"object/get":210}],230:[function(require,module,exports){
module.exports = function (object, value, key) {
    return (object[key] = value);
};
},{}],231:[function(require,module,exports){
var isFunction = require('is/function');
var isObject = require('is/object');
var JSONStringify = require('JSON/stringify');
module.exports = function (obj) {
    return (isObject(obj) ? JSONStringify(obj) : isFunction(obj) ? obj.toString() : obj) + '';
};
},{"JSON/stringify":6,"is/function":150,"is/object":164}],232:[function(require,module,exports){
module.exports = {}.toString;
},{}],233:[function(require,module,exports){
var forOwn = require('object/for-own');
var passesFirstArgument = require('passes/first');
var bindTo = require('function/bind');
module.exports = function (object) {
    var collected = [];
    forOwn(object, passesFirstArgument(function (item) {
        collected.push(item);
    }));
    return collected;
};
},{"function/bind":113,"object/for-own":208,"passes/first":234}],234:[function(require,module,exports){
module.exports = function (fn) {
    return function (first) {
        return fn(first);
    };
};
},{}],235:[function(require,module,exports){
module.exports = function (fn) {
    return function (nil, second) {
        return fn(second);
    };
};
},{}],236:[function(require,module,exports){
(function (global){
var PERFORMANCE = 'performance';
module.exports = global[PERFORMANCE] = global[PERFORMANCE] || {};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],237:[function(require,module,exports){
var performance = require('performance');
var date_offset = require('date/offset');
var now;
if (!performance.now) {
    now = require('date/now');
    performance.now = performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function () {
        return now() - date_offset;
    };
}
module.exports = performance.now;
},{"date/now":103,"date/offset":104,"performance":236}],238:[function(require,module,exports){
module.exports = RegExp(require('regexp/source/apos'), 'g');
},{"regexp/source/apos":240}],239:[function(require,module,exports){
module.exports = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
},{}],240:[function(require,module,exports){
module.exports = "['\u2019]";
},{}],241:[function(require,module,exports){
var reEmptyStringLeading = /\b__p \+= EMPTY_STRING;/g,
    reEmptyStringMiddle = /\b(__p \+=) EMPTY_STRING \+/g,
    reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
// Used to match HTML entities and HTML characters.
var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
    reUnescapedHtml = /[&<>"'`]/g,
    reHasEscapedHtml = RegExp(reEscapedHtml.source),
    reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
// Used to match template delimiters. */
var reEscape = /<%-([\s\S]+?)%>/g,
    reEvaluate = /<%([\s\S]+?)%>/g,
    reInterpolate = /<%=([\s\S]+?)%>/g;
// Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
//* Used to match `RegExp`* [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).*/
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
    reHasRegExpChar = RegExp(reRegExpChar.source);
// Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g,
    reTrimStart = /^\s+/,
    reTrimEnd = /\s+$/;
// Used to match wrap detail comments. */
var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
    reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
    reSplitDetails = /,? & /;
// Used to match words composed of alphanumeric characters. */
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
// Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;
//* Used to match* [ES template delimiters](http://ecma-international.org/ecma-262/7.0/#sec-template-literal-lexical-components).*/
var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
// Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;
// Used to detect hexadecimal string values. */
var reHasHexPrefix = /^0x/i;
// Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
// Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;
// Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;
// Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;
// Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;
// Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
// Used to ensure capturing order of template delimiters. */
var reNoMatch = /($^)/;
// Used to match unescaped characters in compiled string literals. */
var reUnescapedString = /['\n\r\u2028\u2029\\]/g,
    // Used to compose unicode character classes. */
    rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsDingbatRange = '\\u2700-\\u27bf',
    rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
    rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
    rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
    rsPunctuationRange = '\\u2000-\\u206f',
    rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
    rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
    rsVarRange = '\\ufe0e\\ufe0f',
    rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
// Used to compose unicode capture groups. */
var rsApos = "['\u2019]",
    rsAstral = '[' + rsAstralRange + ']',
    rsBreak = '[' + rsBreakRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
    rsDigits = '\\d+',
    rsDingbat = '[' + rsDingbatRange + ']',
    rsLower = '[' + rsLowerRange + ']',
    rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsUpper = '[' + rsUpperRange + ']',
    rsZWJ = '\\u200d';
// Used to compose unicode regexes. */
var rsLowerMisc = '(?:' + rsLower + '|' + rsMisc + ')',
    rsUpperMisc = '(?:' + rsUpper + '|' + rsMisc + ')',
    rsOptLowerContr = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
    rsOptUpperContr = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
    reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')',
    reUnicodeWord = RegExp([
        rsUpper + '?' + rsLower + '+' + rsOptLowerContr + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
        rsUpperMisc + '+' + rsOptUpperContr + '(?=' + [rsBreak, rsUpper + rsLowerMisc, '$'].join('|') + ')',
        rsUpper + '?' + rsLowerMisc + '+' + rsOptLowerContr,
        rsUpper + '+' + rsOptUpperContr,
        rsDigits,
        rsEmoji
    ].join('|'), 'g');
var reComboMark = RegExp(rsCombo, 'g');
module.exports = reUnicodeWord;
},{}],242:[function(require,module,exports){
module.exports = function () {
    return [];
};
},{}],243:[function(require,module,exports){
var isObject = require('is/object');
var isArrayLike = require('is/array-like');
module.exports = function (obj) {
    return !isObject(obj) || isArrayLike(obj) ? [] : {};
};
},{"is/array-like":139,"is/object":164}],244:[function(require,module,exports){
module.exports = require('returns/passed')('');
},{"returns/passed":250}],245:[function(require,module,exports){
module.exports = require('returns/passed')(false);
},{"returns/passed":250}],246:[function(require,module,exports){
module.exports = function (arg) {
    return arg;
};
},{}],247:[function(require,module,exports){
module.exports = {
    array: require('returns/array'),
    baseType: require('returns/base-type'),
    emptyString: require('returns/empty-string'),
    false: require('returns/false'),
    first: require('returns/first'),
    object: require('returns/object'),
    null: require('returns/null'),
    self: require('returns/self'),
    second: require('returns/second'),
    true: require('returns/true'),
    passed: require('returns/passed')
};
},{"returns/array":242,"returns/base-type":243,"returns/empty-string":244,"returns/false":245,"returns/first":246,"returns/null":248,"returns/object":249,"returns/passed":250,"returns/second":251,"returns/self":252,"returns/true":253}],248:[function(require,module,exports){
module.exports = require('returns/passed')(null);
},{"returns/passed":250}],249:[function(require,module,exports){
module.exports = function () {
    return {};
};
},{}],250:[function(require,module,exports){
module.exports = function (value) {
    return function () {
        return value;
    };
};
},{}],251:[function(require,module,exports){
module.exports = function (nil, value) {
    return value;
};
},{}],252:[function(require,module,exports){
module.exports = function () {
    return this;
};
},{}],253:[function(require,module,exports){
module.exports = require('returns/passed')(true);
},{"returns/passed":250}],254:[function(require,module,exports){
var match = require('string/match');
var reAsciiWord = require('regexp/ascii-word');
module.exports = function (string) {
    return match(string, reAsciiWord);
};
},{"regexp/ascii-word":239,"string/match":276}],255:[function(require,module,exports){
var nativeFloor = require('number/floor');
var MAX_SAFE_INTEGER = require('number/max-safe-integer');
module.exports = function (string, n) {
    var result = '';
    if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
        return result;
    }
    // Leverage the exponentiation by squaring algorithm for a faster repeat.
    // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
    do {
        if (n % 2) {
            result += string;
        }
        n = nativeFloor(n / 2);
        if (n) {
            string += string;
        }
    } while (n);
    return result;
};
},{"number/floor":189,"number/max-safe-integer":193}],256:[function(require,module,exports){
var cacheable = require('function/cacheable');
module.exports = cacheable(function (s) {
    return s[0].toUpperCase() + s.slice(1);
});
},{"function/cacheable":117}],257:[function(require,module,exports){
var createCompounder = require('string/create-compounder');
var capitalize = require('string/capitalize');
module.exports = createCompounder(function (result, word, index) {
    word = word.toLowerCase();
    return result + (index ? capitalize(word) : word);
});
},{"string/capitalize":256,"string/create-compounder":264}],258:[function(require,module,exports){
var createCompounder = require('string/create-compounder');
module.exports = createCompounder(function (result, word, index) {
    return result + (index ? '-' : '') + word.toLowerCase();
});
},{"string/create-compounder":264}],259:[function(require,module,exports){
var createCompounder = require('string/create-compounder');
module.exports = createCompounder(function (result, word, index) {
    return result + (index ? ' ' : '') + word.toLowerCase();
});
},{"string/create-compounder":264}],260:[function(require,module,exports){
var createCompounder = require('string/create-compounder');
module.exports = createCompounder(function (result, word, index) {
    return result + (index ? '_' : '') + word.toLowerCase();
});
},{"string/create-compounder":264}],261:[function(require,module,exports){
var createCompounder = require('string/create-compounder');
module.exports = createCompounder(function (result, word, index) {
    return result + (index ? ' ' : '') + word.toUpperCase();
});
},{"string/create-compounder":264}],262:[function(require,module,exports){
module.exports = function (base, next) {
    return base + next;
};
},{}],263:[function(require,module,exports){
var isNumber = require('is/number');
module.exports = function (string_) {
    var converted, string = string_;
    if (isNumber(string)) {
        return string;
    } else {
        string += '';
        converted = +string;
        if (converted === converted) {
            return converted;
        } else {
            return string.split('.').length === 1;
        }
    }
};
},{"is/number":163}],264:[function(require,module,exports){
var words = require('string/words');
var deburr = require('string/deburr');
var reApos = require('regexp/apos');
var cacheable = require('function/cacheable');
var arrayReduce = require('array/reduce');
module.exports = function (callback) {
    return cacheable(function (string) {
        return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
    });
};
},{"array/reduce":84,"function/cacheable":117,"regexp/apos":238,"string/deburr":269,"string/words":290}],265:[function(require,module,exports){
var keys = require('object/keys');
var isNil = require('is/nil');
module.exports = function (map) {
    var source = '(?:' + keys(map).join('|') + ')';
    var testRegexp = new RegExp(source);
    var replaceRegexp = new RegExp(source, 'g');
    return function (string) {
        string = isNil(string) ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };

    function escaper(match) {
        return map[match];
    }
};
},{"is/nil":160,"object/keys":218}],266:[function(require,module,exports){
var nativeCeil = require('number/ceil');
var toArray = require('to/array');
var baseRepeat = require('string/base/repeat');
var baseToString = require('to/base/string');
module.exports = function (length, chars_) {
    var chars = chars_ === undefined ? ' ' : baseToString(chars_);
    var charsLength = chars.length;
    if (charsLength < 2) {
        return charsLength ? baseRepeat(chars, length) : chars;
    }
    var result = baseRepeat(chars, nativeCeil(length / chars.length));
    return hasUnicode(chars) ? castSlice(toArray(result), 0, length).join('') : result.slice(0, length);
};
},{"number/ceil":184,"string/base/repeat":255,"to/array":294,"to/base/string":295}],267:[function(require,module,exports){
module.exports = require('object/base/property-of')(require('string/deburr-letters'));
},{"object/base/property-of":199,"string/deburr-letters":268}],268:[function(require,module,exports){
module.exports = {
    // Latin-1 Supplement block.
    '\xc0': 'A',
    '\xc1': 'A',
    '\xc2': 'A',
    '\xc3': 'A',
    '\xc4': 'A',
    '\xc5': 'A',
    '\xe0': 'a',
    '\xe1': 'a',
    '\xe2': 'a',
    '\xe3': 'a',
    '\xe4': 'a',
    '\xe5': 'a',
    '\xc7': 'C',
    '\xe7': 'c',
    '\xd0': 'D',
    '\xf0': 'd',
    '\xc8': 'E',
    '\xc9': 'E',
    '\xca': 'E',
    '\xcb': 'E',
    '\xe8': 'e',
    '\xe9': 'e',
    '\xea': 'e',
    '\xeb': 'e',
    '\xcc': 'I',
    '\xcd': 'I',
    '\xce': 'I',
    '\xcf': 'I',
    '\xec': 'i',
    '\xed': 'i',
    '\xee': 'i',
    '\xef': 'i',
    '\xd1': 'N',
    '\xf1': 'n',
    '\xd2': 'O',
    '\xd3': 'O',
    '\xd4': 'O',
    '\xd5': 'O',
    '\xd6': 'O',
    '\xd8': 'O',
    '\xf2': 'o',
    '\xf3': 'o',
    '\xf4': 'o',
    '\xf5': 'o',
    '\xf6': 'o',
    '\xf8': 'o',
    '\xd9': 'U',
    '\xda': 'U',
    '\xdb': 'U',
    '\xdc': 'U',
    '\xf9': 'u',
    '\xfa': 'u',
    '\xfb': 'u',
    '\xfc': 'u',
    '\xdd': 'Y',
    '\xfd': 'y',
    '\xff': 'y',
    '\xc6': 'Ae',
    '\xe6': 'ae',
    '\xde': 'Th',
    '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',
    '\u0102': 'A',
    '\u0104': 'A',
    '\u0101': 'a',
    '\u0103': 'a',
    '\u0105': 'a',
    '\u0106': 'C',
    '\u0108': 'C',
    '\u010a': 'C',
    '\u010c': 'C',
    '\u0107': 'c',
    '\u0109': 'c',
    '\u010b': 'c',
    '\u010d': 'c',
    '\u010e': 'D',
    '\u0110': 'D',
    '\u010f': 'd',
    '\u0111': 'd',
    '\u0112': 'E',
    '\u0114': 'E',
    '\u0116': 'E',
    '\u0118': 'E',
    '\u011a': 'E',
    '\u0113': 'e',
    '\u0115': 'e',
    '\u0117': 'e',
    '\u0119': 'e',
    '\u011b': 'e',
    '\u011c': 'G',
    '\u011e': 'G',
    '\u0120': 'G',
    '\u0122': 'G',
    '\u011d': 'g',
    '\u011f': 'g',
    '\u0121': 'g',
    '\u0123': 'g',
    '\u0124': 'H',
    '\u0126': 'H',
    '\u0125': 'h',
    '\u0127': 'h',
    '\u0128': 'I',
    '\u012a': 'I',
    '\u012c': 'I',
    '\u012e': 'I',
    '\u0130': 'I',
    '\u0129': 'i',
    '\u012b': 'i',
    '\u012d': 'i',
    '\u012f': 'i',
    '\u0131': 'i',
    '\u0134': 'J',
    '\u0135': 'j',
    '\u0136': 'K',
    '\u0137': 'k',
    '\u0138': 'k',
    '\u0139': 'L',
    '\u013b': 'L',
    '\u013d': 'L',
    '\u013f': 'L',
    '\u0141': 'L',
    '\u013a': 'l',
    '\u013c': 'l',
    '\u013e': 'l',
    '\u0140': 'l',
    '\u0142': 'l',
    '\u0143': 'N',
    '\u0145': 'N',
    '\u0147': 'N',
    '\u014a': 'N',
    '\u0144': 'n',
    '\u0146': 'n',
    '\u0148': 'n',
    '\u014b': 'n',
    '\u014c': 'O',
    '\u014e': 'O',
    '\u0150': 'O',
    '\u014d': 'o',
    '\u014f': 'o',
    '\u0151': 'o',
    '\u0154': 'R',
    '\u0156': 'R',
    '\u0158': 'R',
    '\u0155': 'r',
    '\u0157': 'r',
    '\u0159': 'r',
    '\u015a': 'S',
    '\u015c': 'S',
    '\u015e': 'S',
    '\u0160': 'S',
    '\u015b': 's',
    '\u015d': 's',
    '\u015f': 's',
    '\u0161': 's',
    '\u0162': 'T',
    '\u0164': 'T',
    '\u0166': 'T',
    '\u0163': 't',
    '\u0165': 't',
    '\u0167': 't',
    '\u0168': 'U',
    '\u016a': 'U',
    '\u016c': 'U',
    '\u016e': 'U',
    '\u0170': 'U',
    '\u0172': 'U',
    '\u0169': 'u',
    '\u016b': 'u',
    '\u016d': 'u',
    '\u016f': 'u',
    '\u0171': 'u',
    '\u0173': 'u',
    '\u0174': 'W',
    '\u0175': 'w',
    '\u0176': 'Y',
    '\u0177': 'y',
    '\u0178': 'Y',
    '\u0179': 'Z',
    '\u017b': 'Z',
    '\u017d': 'Z',
    '\u017a': 'z',
    '\u017c': 'z',
    '\u017e': 'z',
    '\u0132': 'IJ',
    '\u0133': 'ij',
    '\u0152': 'Oe',
    '\u0153': 'oe',
    '\u0149': "'n",
    '\u017f': 'ss'
};
},{}],269:[function(require,module,exports){
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
var deburrLetter = require('string/deburr-letter');
var toString = require('to/string');
module.exports = function (str) {
    var string = toString(str);
    return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
};
},{"string/deburr-letter":267,"to/string":306}],270:[function(require,module,exports){
module.exports = function (str, prefix) {
    var nuStr = str.slice(prefix && prefix.length);
    return nuStr[0] + nuStr.slice(1);
};
},{}],271:[function(require,module,exports){
module.exports = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
};
},{}],272:[function(require,module,exports){
module.exports = require('string/create-escaper')(require('string/escape-map'));
},{"string/create-escaper":265,"string/escape-map":271}],273:[function(require,module,exports){
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
module.exports = function hasUnicodeWord(string) {
    return reHasUnicodeWord.test(string);
};
},{}],274:[function(require,module,exports){
module.exports = function (string, indentation) {
    return string.split('\n').join('\n' + (indentation || '    '));
};
},{}],275:[function(require,module,exports){
module.exports = function (item) {
    return item && item.toLowerCase && item.toLowerCase();
};
},{}],276:[function(require,module,exports){
module.exports = function (string, regexp) {
    return string.match(regexp) || [];
};
},{}],277:[function(require,module,exports){
module.exports = maxVersion;
var map = require('array/map');
var convertVersionString = require('string/convert-version');
var isStrictlyEqual = require('is/strictly-equal');
var isTrue = require('is/true');
var isFalse = require('is/false');
var isUndefined = require('is/undefined');
var toNumber = require('to/number');
var LENGTH = 'length';

function maxVersion(string1, string2) {
    // string 2 is always the underdogl
    var split1, split2, split1Length, split2Length, provenLarger, cvs1Result = convertVersionString(string1),
        cvs2Result = convertVersionString(string2);
    // keyword checks
    if (isTrue(cvs1Result) || isTrue(cvs2Result)) {
        return true;
    } else if (isFalse(cvs1Result) && isFalse(cvs2Result)) {
        // compare them as version strings
        split1 = string1.split('.');
        split2 = string2.split('.');
        split1Length = split1[LENGTH];
        split2Length = split2[LENGTH];
        map(split1, function (value, index) {
            if (toNumber(value) < toNumber(split2[index] || 0)) {
                provenLarger = true;
            }
        });
        if (isStrictlyEqual(split1Length, 1) && isStrictlyEqual(split2Length, 3)) {
            return true;
        }
        if (isStrictlyEqual(split1Length, 3) && isStrictlyEqual(split2Length, 1)) {
            return false;
        }
        if (isUndefined(provenLarger) && split2Length > split1Length) {
            provenLarger = true;
        }
        return !!provenLarger;
    } else {
        return string1 <= string2;
    }
}
},{"array/map":72,"is/false":147,"is/strictly-equal":169,"is/true":173,"is/undefined":176,"string/convert-version":263,"to/number":302}],278:[function(require,module,exports){
module.exports = (function () {
    var cache = {};
    return function (string) {
        var found = cache[string];
        if (!found) {
            cache[string] = found = new Function.constructor('return ' + string);
        }
        return found();
    };
}());
},{}],279:[function(require,module,exports){
var toString = require('to/string');
var toInteger = require('to/integer');
var createPadding = require('string/create-padding');
module.exports = function (string_, length_, chars) {
    var string = toString(string_);
    var length = toInteger(length_);
    var strLength = length ? string.length : 0;
    return (length && strLength < length) ? ''.concat(string.createPadding(length - strLength, chars)) : string;
};
},{"string/create-padding":266,"to/integer":299,"to/string":306}],280:[function(require,module,exports){
var toString = require('to/string');
var toInteger = require('to/integer');
var createPadding = require('string/create-padding');
module.exports = function (string_, length_, chars) {
    var string = toString(string_);
    var length = toInteger(length_);
    var strLength = length ? string.length : 0;
    return (length && strLength < length) ? ''.concat(createPadding(length - strLength, chars).string) : string;
};
},{"string/create-padding":266,"to/integer":299,"to/string":306}],281:[function(require,module,exports){
var toString = require('to/string');
var toInteger = require('to/integer');
var nativeFloor = require('number/floor');
var createPadding = require('string/create-padding');
var nativeCeil = require('number/ceil');
module.exports = function pad(string_, length_, chars) {
    var string = toString(string_);
    var length = toInteger(length_);
    var strLength = length ? string.length : 0;
    if (!length || strLength >= length) {
        return string;
    }
    var mid = (length - strLength) / 2;
    return ''.concat(createPadding(nativeFloor(mid), chars), string, createPadding(nativeCeil(mid), chars));
};
},{"number/ceil":184,"number/floor":189,"string/create-padding":266,"to/integer":299,"to/string":306}],282:[function(require,module,exports){
module.exports = function (object) {
    return typeof object;
};
},{}],283:[function(require,module,exports){
module.exports = require('object/invert')(require('string/escape-map'));
},{"object/invert":215,"string/escape-map":271}],284:[function(require,module,exports){
module.exports = require('string/create-escaper')(require('string/unescape-map'));
},{"string/create-escaper":265,"string/unescape-map":283}],285:[function(require,module,exports){
var match = require('string/match');
var reUnicodeWord = require('regexp/unicode-word');
module.exports = function (string) {
    return match(string, reUnicodeWord);
};
},{"regexp/unicode-word":241,"string/match":276}],286:[function(require,module,exports){
var toArray = require('to/array');
var categoricallyCacheable = require('function/cacheable/categorically');
module.exports = categoricallyCacheable(function (unitList_) {
    var lengthHash = {},
        hash = {},
        lengths = [],
        unitList = toArray(unitList_),
        sortedUnitList = unitList.sort(function (a, b) {
            var aLength = a.length,
                bLength = b.length,
                value = Math.max(-1, Math.min(1, aLength - bLength));
            hash[a] = hash[b] = true;
            if (!lengthHash[aLength]) {
                lengthHash[aLength] = true;
                lengths.push(aLength);
            }
            if (!lengthHash[bLength]) {
                lengthHash[bLength] = true;
                lengths.push(bLength);
            }
            return -1 * (value === 0 ? (a > b ? -1 : 1) : value);
        });
    lengths.sort(function (a, b) {
        return -1 * Math.max(-1, Math.min(1, a - b));
    });
    return function (str_) {
        var ch, unitStr, unit,
            i = 0,
            str = (str_ + '').trim(),
            length = str.length;
        while (lengths[i]) {
            if (lengths[i] < length) {
                unit = str.substr(length - lengths[i], length);
                if (hash[unit]) {
                    return unit;
                }
            }
            i++;
        }
        return false;
    };
});
},{"function/cacheable/categorically":116,"to/array":294}],287:[function(require,module,exports){
var customUnits = require('string/units/custom');
var baseUnitList = require('string/units/list');
module.exports = function (str) {
    return customUnits(str, baseUnitList);
};
},{"string/units/custom":286,"string/units/list":288}],288:[function(require,module,exports){
var toArray = require('to/array', ',');
module.exports = toArray('px,em,rem,ex,in,cm,%,vh,vw,pc,pt,mm,vmax,vmin');
},{"to/array":294}],289:[function(require,module,exports){
(function (global){
var cryptoCheck = 'crypto' in global && 'getRandomValues' in crypto;
var uuidHash = {};
module.exports = function () {
    return _uuid(4);
};

function _uuid(idx) {
    var sid = ('xxxxxxxx-xxxx-' + idx + 'xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g, function (c) {
        var rnd, r, v;
        if (cryptoCheck) {
            rnd = global.crypto.getRandomValues(new Uint32Array(1));
            if (rnd === undefined) {
                cryptoCheck = false;
            }
        }
        if (!cryptoCheck) {
            rnd = [Math.floor(Math.random() * 10e12)];
        }
        rnd = rnd[0];
        r = rnd % 16;
        v = (c === 'x') ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    // if crypto check passes, you can trust the browser
    return uuidHash[sid] ? _uuid(idx + 1) : (uuidHash[sid] = true) && sid;
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],290:[function(require,module,exports){
var match = require('string/match');
var isUndefined = require('is/undefined');
var unicodeWords = require('string/unicode-words');
var asciiWords = require('string/ascii-words')
var hasUnicodeWord = require('string/has-unicode-word');
var toString = require('to/string');
module.exports = function (string_, pattern_, guard) {
    var string = toString(string_),
        pattern = guard ? undefined : pattern_;
    if (isUndefined(pattern)) {
        return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
    }
    return match(string, pattern);
};
},{"is/undefined":176,"string/ascii-words":254,"string/has-unicode-word":273,"string/match":276,"string/unicode-words":285,"to/string":306}],291:[function(require,module,exports){
(function (global){
var Symbol = global.Symbol;
var symbolProto = Symbol ? Symbol.prototype : undefined;
module.exports = symbolProto ? symbolProto.toString : undefined;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],292:[function(require,module,exports){
var SIXTY = 60,
    SEVEN = 7,
    THIRTY = 30,
    TWENTY_FOUR = 24,
    ONE_THOUSAND = 1000,
    THREE_HUNDRED_SIXTY_FIVE = 365,
    ONE_THOUSAND_SIXTY = ONE_THOUSAND * SIXTY,
    THREE_HUNDRED_SIXTY_THOUSAND = ONE_THOUSAND_SIXTY * SIXTY,
    EIGHTY_SIX_MILLION_FOUR_HUNDRED_THOUSAND = THREE_HUNDRED_SIXTY_THOUSAND * TWENTY_FOUR,
    SIX_HUNDRED_FOUR_MILLION_EIGHT_HUNDRED_THOUSAND = THREE_HUNDRED_SIXTY_THOUSAND * SEVEN,
    TWO_BILLION_FIVE_HUNDRED_NINETY_TWO_MILLION = THREE_HUNDRED_SIXTY_THOUSAND * THIRTY,
    THIRTY_ONE_BILLION_FIVE_HUNDRED_THIRTY_SIX_MILLION = EIGHTY_SIX_MILLION_FOUR_HUNDRED_THOUSAND * THREE_HUNDRED_SIXTY_FIVE;
module.exports = {
    ms: 1,
    secs: ONE_THOUSAND,
    s: ONE_THOUSAND,
    mins: ONE_THOUSAND_SIXTY,
    hrs: THREE_HUNDRED_SIXTY_THOUSAND,
    days: EIGHTY_SIX_MILLION_FOUR_HUNDRED_THOUSAND,
    wks: SIX_HUNDRED_FOUR_MILLION_EIGHT_HUNDRED_THOUSAND,
    mnths: TWO_BILLION_FIVE_HUNDRED_NINETY_TWO_MILLION,
    yrs: THIRTY_ONE_BILLION_FIVE_HUNDRED_THIRTY_SIX_MILLION
};
},{}],293:[function(require,module,exports){
var forEach = require('array/for/each');
var toArray = require('to/array');
var customUnits = require('string/units/custom');
var cacheable = require('function/cacheable');
var TIME_CONSTANTS = require('time/constants');
var reduce = require('array/reduce');
var toNumber = require('to/number');
var timeUnits = [];
var timeUnitToNumber = reduce(TIME_CONSTANTS, function (memo, number, unit) {
    timeUnits.push(unit);
    memo[unit] = function (input) {
        return input * number;
    };
}, {});
module.exports = cacheable(function (number_) {
    var time = 0;
    forEach(toArray(number_ + ''), function (num_) {
        var num = num_,
            unit = customUnits(num, timeUnits),
            number = toNumber(num.split(unit || '').join('')),
            handler = timeUnitToNumber[unit];
        // there's a handler for this unit, adn it's not NaN
        if (number === number) {
            if (handler) {
                number = handler(number);
            }
            time += number;
        }
    });
    return time;
});
},{"array/for/each":56,"array/reduce":84,"function/cacheable":117,"string/units/custom":286,"time/constants":292,"to/array":294,"to/number":302}],294:[function(require,module,exports){
var isArray = require('is/array');
var isArrayLike = require('is/array-like');
var isString = require('is/string');
var COMMA = ',';
module.exports = function (object, delimiter) {
    return isArrayLike(object) ? (isArray(object) ? object : arrayLikeToArray(object)) : (isString(object) ? object.split(isString(delimiter) ? delimiter : COMMA) : [object]);
};

function arrayLikeToArray(arrayLike) {
    return arrayLike.length === 1 ? [arrayLike[0]] : Array.apply(null, arrayLike);
}
},{"is/array":140,"is/array-like":139,"is/string":170}],295:[function(require,module,exports){
var symbolToString = require('symbol/to-string');
var isString = require('is/string');
var isSymbol = require('is/symbol');
module.exports = function (value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (isString(value)) {
        return value;
    }
    if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
};
},{"is/string":170,"is/symbol":171,"symbol/to-string":291}],296:[function(require,module,exports){
var MAX_INTEGER = require('number/max-integer');
var isStrictlyEqual = require('is/strictly-equal');
var toNumber = require('to/number');
var isInfinite = require('is/infinite');
module.exports = function (value) {
    var sign;
    if (!value) {
        return isStrictlyEqual(value, 0) ? value : 0;
    }
    value = toNumber(value);
    if (isInfinite(value)) {
        sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
    }
    return isNotNan(value) ? value : 0;
};
},{"is/infinite":154,"is/strictly-equal":169,"number/max-integer":192,"to/number":302}],297:[function(require,module,exports){
var returns = require('returns/passed');
var isFunction = require('is/function');
module.exports = function (argument) {
    return isFunction(argument) ? argument : returns(argument);
};
},{"is/function":150,"returns/passed":250}],298:[function(require,module,exports){
module.exports = {
    array: require('to/array'),
    boolean: require('boolean/cast'),
    finite: require('to/finite'),
    function: require('to/function'),
    integer: require('to/integer'),
    iterable: require('to/iterable'),
    length: require('to/length'),
    number: require('to/number'),
    object: require('to/object'),
    path: require('to/path'),
    stringResult: require('to/string-result'),
    string: require('to/string'),
};
},{"boolean/cast":97,"to/array":294,"to/finite":296,"to/function":297,"to/integer":299,"to/iterable":300,"to/length":301,"to/number":302,"to/object":303,"to/path":304,"to/string":306,"to/string-result":305}],299:[function(require,module,exports){
var MAX_SAFE_INTEGER = require('number/max-safe-integer');
var MIN_SAFE_INTEGER = -MAX_SAFE_INTEGER;
var clamp = require('number/clamp');
var toNumber = require('to/number');
module.exports = function (number, notSafe) {
    var converted;
    return floatToInteger((converted = toNumber(number)) == number ? (notSafe ? converted : safeInteger(converted)) : 0);
};

function floatToInteger(value) {
    var remainder = value % 1;
    return value === value ? (remainder ? value - remainder : value) : 0;
}

function safeInteger(number) {
    return clamp(number, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER);
}
},{"number/clamp":185,"number/max-safe-integer":193,"to/number":302}],300:[function(require,module,exports){
var matches = require('object/matches');
var property = require('object/property');
var isObject = require('is/object');
var isFunction = require('is/function');
var isArray = require('is/array');
var matchesProperty = require('object/matches/property');
module.exports = toIterable;

function toIterable(iteratee) {
    return isFunction(iteratee) ? iteratee : (isArray(iteratee) ? matchesProperty(iteratee) : (isObject(iteratee) ? matches(iteratee) : property(iteratee)));
}
},{"is/array":140,"is/function":150,"is/object":164,"object/matches":221,"object/matches/property":222,"object/property":229}],301:[function(require,module,exports){
var toInteger = require('to/integer');
var clamp = require('number/clamp');
var MAX_ARRAY_LENGTH = 4294967295;
module.exports = function (number) {
    return number ? clamp(toInteger(number, true), 0, MAX_ARRAY_LENGTH) : 0;
};
},{"number/clamp":185,"to/integer":299}],302:[function(require,module,exports){
module.exports = function (item) {
    // this is a type coersion from "3" to 3
    return +item;
};
},{}],303:[function(require,module,exports){
var isObject = require('is/object');
module.exports = function (argument) {
    return isObject(argument) ? argument : {};
};
},{"is/object":164}],304:[function(require,module,exports){
var toString = require('to/string');
var exp = /\]\.|\.|\[|\]/igm;
module.exports = function (string) {
    return toString(string).split(exp);
};
},{"to/string":306}],305:[function(require,module,exports){
module.exports = function (string) {
    return '[object ' + string + ']';
};
},{}],306:[function(require,module,exports){
var isNil = require('is/nil');
var baseToString = require('to/base/string');
module.exports = function (value) {
    return isNil(value) ? '' : baseToString(value);
};
},{"is/nil":160,"to/base/string":295}],307:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":313}],308:[function(require,module,exports){
(function (global){
/*global window, global*/
var util = require("util")
var assert = require("assert")
var now = require("date-now")

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    var duration = now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"assert":307,"date-now":309,"util":313}],309:[function(require,module,exports){
module.exports = now

function now() {
    return new Date().getTime()
}

},{}],310:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],311:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],312:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],313:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":312,"_process":310,"inherits":311}]},{},[1]);
