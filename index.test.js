var b = require('batterie');
b.REWRITABLE_LOG = false;
var _ = require('debit');
var boxography = require('.');
b.describe('boxography', function () {
    b.expect(boxography).toBeFunction();
    b.expect(function () {
        boxography();
    }).toThrow();
    b.it('computes lines', function (t) {
        var result = boxography({
            compute: function (x, y) {
                // some function computes
                return x >= 300 && x <= 599 && y >= 200 && y <= 399 ? 'x' : (x >= 450 && x <= 999 && y >= 300 && y <= 600 ? 'y' : 'z');
            },
            limits: {
                x: 1000,
                y: 1000
            },
            matrix: [
                [300, 200],
                [999, 600]
            ]
        });
        t.expect(result).toBeObject();
        t.expect(result.matrix).toBeArray();
    }, 2);
});
b.finish().then(b.logger());