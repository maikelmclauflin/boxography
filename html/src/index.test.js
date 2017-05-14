var _ = require('debit');
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
window._ = _;

function compute() {
    var colors = {
        x: 'black',
        y: 'green',
        z: 'red'
    };
    var x = 200;
    var y = 50;
    var size = 0;
    // var matrix = [
    //     [250, 500],
    //     [650, 500],
    //     [450, 250]
    // ];
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
    ], shift);
    var results = boxography({
        matrix: matrix,
        computeLimits: false,
        limits: {
            x: window.innerWidth,
            y: window.innerHeight
        },
        continues: function (found) {
            return _.keys(found).length < 3;
        }
    }, function (x, y) {
        // some function computes
        return x >= 300 && x <= 600 && y >= 200 && y <= 400 ? 'x' : (x >= 450 && x <= 999 && y >= 300 && y <= window.innerHeight ? 'y' : 'z');
    });
    results.forEachBorder(function (cell) {
        context.fillStyle = colors[cell[2]];
        context.fillRect(cell[0] - 1, cell[1] - 1, 1, 1);
    });

    function shift(row) {
        return [row[0] + x - (size / 2), row[1] + y - (size / 2), row[0] + x + (size / 2), row[1] + y + (size / 2)];
    }
}
window.addEventListener('resize', draw);
draw();

function draw() {
    canvas.setAttribute('height', window.innerHeight);
    canvas.setAttribute('width', window.innerWidth);
    compute();
}