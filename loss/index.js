module.exports = loss;
var assign = require('@timelaps/object/assign');
var baseline = require('./defaults');
var isNull = require('@timelaps/is/null');

function loss(options) {
    var loss = assign(baseline(), options);
    if (isNull(loss.top)) {
        loss.top = Infinity;
    }
    return loss;
}