module.exports = fromCoords;
var LARGE_INTEGER = require('@specless/layout/constants').LARGE_INTEGER;

function fromCoords(minX, minY, maxX, maxY) {
    return {
        minX: minX || 1,
        minY: minY || 1,
        maxX: maxX || LARGE_INTEGER,
        maxY: maxY || LARGE_INTEGER
    };
}