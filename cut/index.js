module.exports = cut;
var under1 = require('@timelaps/number/under1');
var rectangle = require('../rectangle');
var triangle = require('../triangle');

function cut(bounds, aspect, approaches, layout) {
    if (!bounds || !bounds.length) {
        return [];
    }
    var cutOffMin = aspect > approaches;
    var cutOffMax = aspect < approaches;
    if (!cutOffMin && !cutOffMax) {
        return [];
    }
    var topRightCorner = bounds[1];
    var bottomLeftCorner = bounds[3];
    var maxAspect = topRightCorner.x / topRightCorner.y;
    var minAspect = bottomLeftCorner.x / bottomLeftCorner.y;
    var tooBig = aspect >= maxAspect;
    var tooSmall = aspect <= minAspect;
    if (tooBig || tooSmall) {
        return [];
    }
    // when aspect is on the opposite side
    // of where it could possibly cut
    // then get rid of everything
    if (cutOffMin && aspect >= maxAspect) {
        return bounds;
    } else if (cutOffMax && aspect <= minAspect) {
        return bounds;
    }
    // somewhere in between
    // so which side of the min(s) point does it fall on
    if (aspect > approaches) {
        // cutting off bottom-right
        return cutter(bounds, aspect, function (polygon, x1, y1, minimumsAspect, x2, y2, maximumsAspect) {
            // top side
        }, function (polygon, x1, y1, minimumsAspect, x2_, y2, maximumsAspect) {
            // var x2 = x2_;
            // if (maximumsAspect > aspect) {
            //     x2 = y2 * aspect;
            //     polygon.push(rectangle(x2, y1, x2_, y2));
            // }
            // polygon.push(triangle(x1, y1, x2, y2, true));
        });
    } else if (aspect < approaches) {
        // cutting off top-right
        return cutter(bounds, aspect, function (polygon, x1, y1, minimumsAspect, x3, y3, maximumsAspect) {
            var minimalAspect = under1(aspect);
            var x2 = x3;
            var y2 = x3 * minimalAspect;
            if (maximumsAspect > aspect) {
                x2 = y3 * aspect;
                y2 = y3;
                // and bottom-right
                polygon.push(rectangle(x2, y1, x3, y3));
            }
            polygon.push(triangle(y1 / minimalAspect, y1, x2, y2, true));
        }, function (polygon, x1, y1, minimumsAspect, x3, y3, maximumsAspect) {
            // left side
            var minimalAspect = under1(aspect);
            var x2 = x3;
            var y2 = x1 / minimalAspect;
            polygon.push(rectangle(x1, y1, x3, y2));
            if (maximumsAspect > aspect) {
                // take another rect
                // from the right side
                x2 = y2_ / aspect;
                polygon.push(rectangle(x2, y2, x3, y3));
            }
            polygon.push(triangle(x1, y2, x2, x2 / aspect, true));
        });
    } else {
        return [];
    }
}

function cutter(bounds, aspect, top, left) {
    var polygon = [];
    var topLeftCorner = bounds[0];
    var bottomRightCorner = bounds[2];
    var x1 = topLeftCorner.x;
    var y1 = topLeftCorner.y;
    var x2 = bottomRightCorner.x;
    var y2 = bottomRightCorner.y;
    var minimumsAspect = x1 / y1;
    var maximumsAspect = x2 / y2;
    if (minimumsAspect <= aspect) {
        // through the top side
        method = top;
    } else {
        method = left;
    }
    method(polygon, x1, y1, minimumsAspect, x2, y2, maximumsAspect);
    return polygon;
}