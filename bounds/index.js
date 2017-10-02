module.exports = boundaries;
var math = Math;
var fromCoords = require('./from-coords');
var LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER;

function boundaries(layout, dims_) {
    var dims = dims_ || {};
    var untilWidth = dims.width || LARGE_INTEGER;
    var untilHeight = dims.height || LARGE_INTEGER;
    var width = layout.width;
    var scale = layout.scale;
    var height = layout.height;
    var minWidth = layout.minWidth;
    var maxWidth = layout.maxWidth;
    var minHeight = layout.minHeight;
    var maxHeight = layout.maxHeight;
    var actualMinWidth = max(width[0] * scale[0], minWidth);
    var actualMinHeight = max(height[0] * scale[0], minHeight);
    var actualMaxWidth = min(maxWidth, untilWidth);
    var actualMaxHeight = min(maxHeight, untilHeight);
    if (actualMinWidth > actualMaxWidth || actualMinHeight > actualMaxHeight) {
        return [];
    } else {
        return fromCoords(actualMinWidth, actualMinHeight, actualMaxWidth, actualMaxHeight);
    }
}

function min(a, b) {
    return math.min(a, b);
}

function max(a, b) {
    return math.max(a, b);
}