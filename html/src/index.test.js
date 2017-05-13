var _ = require('debit');
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
window._ = _;
setCanvasSize();
var colors = {
    x: 'black',
    y: 'green',
    z: 'red'
};
var matrix = _.map([
    [250, 250],
    [250, 500],
    [300, 450],
    [350, 400],
    [400, 350],
    [450, 300],
    [500, 250],
    [450, 200],
    [400, 150],
    [350, 100],
    [300, 50],
    [250, 0],
    [200, 50],
    [150, 100],
    [100, 150],
    [50, 200],
    [0, 250],
    [50, 300],
    [100, 350],
    [150, 400],
    [200, 450]
], function (row) {
    return [row[0] + 100, row[1] + 100];
});
// var matrix = [
//     [300, 300],
//     [970, 90],
//     [728, 90],
//     [300, 600],
//     [600, 600],
//     [700, 400]
// ];
// console.log(matrix);
var results = boxography({
    compute: function (x, y) {
        // some function computes
        return x >= 300 && x <= 599 && y >= 200 && y <= 399 ? 'x' : (x >= 450 && x <= 999 && y >= 300 && y <= 600 ? 'y' : 'z');
    },
    limits: {
        x: 1000,
        y: 1000
    },
    matrix: matrix,
    matrixify: function (cell) {
        context.fillStyle = colors[cell[2]];
        context.fillRect(cell[0], cell[1], 1, 1);
    }
});
console.log(results);
// _.map(Array(8), function () {
//         return [Math.floor(Math.random() * 1000), Math.floor(Math.random() * 600)];
//     })
window.addEventListener('resize', setCanvasSize);

function setCanvasSize() {
    canvas.setAttribute('height', window.innerHeight);
    canvas.setAttribute('width', window.innerWidth);
}