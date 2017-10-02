module.exports = closest;
var withinBounds = require('../bounds/within');
var withinLoss = require('../loss/within');
var reduceOwn = require('@timelaps/array/reduce/own');
var find = require('@timelaps/array/find');

function closest(x, y, result) {
    var isOver = over(x, y);
    return reduceOwn(result, function (memo, datum) {
        if (isOver(datum)) {
            memo.push(datum);
        }
        return memo;
    }, []);
}

function over(x, y) {
    return function (datum) {
        return withinBounds(x, y, datum.bounds) && !find(datum.losses, function (loss) {
            return withinLoss(x, y, loss);
        });
    };
}