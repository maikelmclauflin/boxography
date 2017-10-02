module.exports = intersection;
var round = require('@timelaps/number/round');
var midpointWidth = midpoint('width');
var midpointHeight = midpoint('height');

function midpoint(key) {
    return function (layout) {
        var dimension = layout[key];
        return (dimension[1] + dimension[0]) / 2;
    };
}

function intersection(a, b) {
    var p1 = [midpointWidth(a), midpointHeight(a)];
    var p2 = [midpointWidth(b), midpointHeight(b)];
    var slope1 = p1[1] / p1[0];
    var slope2 = p2[1] / p2[0];
    var average = Math.sqrt(slope1) * Math.sqrt(slope2);
    var multi = 1000;
    var avg = [multi, average * multi];
    if (slope1 === slope2) {
        var x = Math.sqrt(p1[0] / slope2) * Math.sqrt(p2[0]);
        var y = Math.sqrt(p1[1] / slope2) * Math.sqrt(p2[1]);
        return {
            x: round(x, -8),
            y: round(y, -8)
        };
    } else {
        // do for 1 and 2
        var A1 = p2[1] - p1[1];
        var B1 = p1[0] - p2[0];
        var C1 = A1 * p1[0] + B1 * p1[1];
        var A2 = avg[1] - 0;
        var B2 = 0 - avg[0];
        var C2 = A2 * 0 + B2 * 0;
        var det = (A1 * B2) - (A2 * B1);
        var X = ((B2 * C1) - (B1 * C2)) / det;
        var Y = ((A1 * C2) - (A2 * C1)) / det;
        return {
            x: round(X, -8),
            y: round(Y, -8)
        };
    }
}