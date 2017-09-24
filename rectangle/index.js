module.exports = rectangle;

function rectangle(x1, y1, x2, y2) {
    return [{
        x: x1,
        y: y1
    }, {
        x: x2,
        y: y1
    }, {
        x: x2,
        y: y2
    }, {
        x: x1,
        y: y2
    }];
}