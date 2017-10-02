module.exports = cut;
var under1 = require('@timelaps/number/under1');
var loss = require('../loss');
var assign = require('@timelaps/object/assign');

function cut(bounds, aspect, approaches, layout) {
    var cutOffMin = aspect > approaches;
    var cutOffMax = aspect < approaches;
    if (!cutOffMin && !cutOffMax) {
        return [];
    }
    var maxAspect = bounds.maxX / bounds.minY;
    var minAspect = bounds.minX / bounds.maxY;
    var tooBig = aspect >= maxAspect;
    var tooSmall = aspect <= minAspect;
    var approachingInfinity = approaches === Infinity;
    var approaching0 = approaches === 0;
    if ((tooBig && approachingInfinity) || (tooSmall && approaching0)) {
        return [];
    }
    // when aspect is on the opposite side
    // of where it could possibly cut
    // then get rid of everything
    var cutOffAllMin = (cutOffMin && aspect >= maxAspect);
    var cutOffAllMax = (cutOffMax && aspect <= minAspect);
    if (cutOffAllMin || cutOffAllMax) {
        return [loss(assign({
            aspect: aspect,
            top: cutOffAllMax
        }, bounds))];
    }
    // somewhere in between
    // so which side of the min(s) point does it fall on
    var top = false;
    if (approaching0) {
        //
    } else if (approachingInfinity) {
        top = true;
    } else {
        // something was not a number
        return [];
    }
    return [loss({
        aspect: aspect,
        top: top,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY
    })];
}