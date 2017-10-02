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
var boundaries = require('../bounds');
var cut = require('../cut');
var min = require('@specless/layout/min');
var max = require('@specless/layout/max');
var crosses = require('../bounds/crosses');
var forOwn = require('@timelaps/n/for/own');
var intersection = require('../intersection');
module.exports = boxography;

function boxography(layouts_, dims, test) {
    return reduce(layouts_, function (data, layout_) {
        var layout = create(layout_);
        var id = layout.id;
        var bounds = boundaries(layout, dims);
        var maxLoss = cut(bounds, layout.maxAspect, Infinity);
        var minLoss = cut(bounds, layout.minAspect, 0);
        var datum = {
            layout: layout,
            bounds: bounds,
            losses: minLoss.concat(maxLoss)
        };
        forOwn(data, removeConflicts(datum));
        // iterate through all other bounds
        data[id] = datum;
        return data;
    }, {});
}

function removeConflicts(datum1) {
    var layout1 = datum1.layout;
    var minAspect1 = min.aspect(layout1);
    var maxAspect1 = max.aspect(layout1);
    var bounds1 = datum1.bounds;
    var losses1 = datum1.losses;
    return function (datum2) {
        var bounds2 = datum2.bounds;
        var losses2 = datum2.losses;
        if (!crosses(bounds1, bounds2)) {
            // does not interact
            return;
        }
        var layout2 = datum2.layout;
        var minAspect2 = min.aspect(layout2);
        var maxAspect2 = max.aspect(layout2);
        var secondIsGreater = minAspect1 > minAspect2;
        if (minAspect1 === minAspect2) {
            // equal
            return;
        }
        var cross = intersection(layout1, layout2);
        var crossAspect = cross.x / cross.y;
        losses1.push.apply(losses1, cut(bounds2, crossAspect, secondIsGreater ? 0 : Infinity));
        losses2.push.apply(losses2, cut(bounds1, crossAspect, secondIsGreater ? Infinity : 0));
    };
}