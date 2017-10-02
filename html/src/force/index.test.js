var layout = require('@specless/layout'),
    allLayouts = require('../layoutbackup'),
    boxography = require('../../../force'),
    $canvas = document.querySelector('#canvas'),
    context = $canvas.getContext('2d');
window.addEventListener('resize', setCanvasSize);
window.addEventListener('orientationchange', setCanvasSize);
setCanvasSize();
draw();

function draw() {
    var result = boxography(function (x, y) {
        // this is the only thing you need to make your own
        return layout.closest(allLayouts, {
            width: x,
            height: y
        }).name;
    }, {
        layouts: allLayouts
    });
    // render the canvas
    console.log(result);
    result.forEachBorder(function (cell) {
        var x = cell[0];
        var y = cell[1];
        var id = cell[2];
        context.fillStyle = 'black';
        context.fillRect(x - 1, y - 1, 1, 1);
    });
}

function setCanvasSize() {
    $canvas.height = window.innerHeight + '';
    $canvas.width = window.innerWidth + '';
}