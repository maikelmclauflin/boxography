module.exports = withinLoss;
var withinBounds = require('../../bounds/within');

function withinLoss(x, y, loss) {
    return withinBounds(x, y, loss) && checkDiagonal(x, y, loss);
}

function checkDiagonal(x, y, loss) {
    var lossAspect = loss.aspect;
    var aspect = x / y;
    if (loss.top) {
        return aspect >= lossAspect;
    } else {
        return aspect <= lossAspect;
    }
}