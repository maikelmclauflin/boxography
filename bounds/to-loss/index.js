module.exports = boundsToLoss;
var loss = require('../../loss');
var assign = require('@timelaps/object/assign');

function boundsToLoss(bounds) {
    return loss(assign({
        slope: 0,
        top: true
    }, bounds));
}