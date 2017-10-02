module.exports = defaults;
var LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER;
var assign = require('@timelaps/object/assign');
var defaultBounds = require('../bounds/from-coords');

function defaults() {
    return assign(defaultBounds(), {
        aspect: 0,
        x: 0,
        y: 0,
        top: false
    });
}