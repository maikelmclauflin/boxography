module.exports = triangle;

function triangle(x1, y1, x2, y2, rightAngleAbove) {
    var third;
    var hypEnd = {
        x: x2,
        y: y2
    };
    var second = hypEnd;
    if (rightAngleAbove) {
        third = second;
        second = {
            x: x2,
            y: y1
        };
    } else {
        third = {
            x: x1,
            y: y2
        };
    }
    return [{
        x: x1,
        y: y1
    }, second, third];
}