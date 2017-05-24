specless.scope().run(global, function (module, app, _, factories, $) {
    var $canvas = $('#canvas'),
        layoutManager = factories.LayoutManager(),
        context = $canvas.element().getContext('2d');
    layoutManager.add(layoutdata);
    setCanvasSize();

    function draw() {
        var result = boxography({
            matrix: layoutManager.map(function (layout) {
                return [ //
                    layout.minWidth(), layout.minHeight(), //
                    layout.maxWidth(), layout.maxHeight()
                ];
            }),
            limits: {
                x: window.innerWidth,
                y: window.innerHeight
            },
            computeLimits: true,
            continues: function (found) {
                return _.keys(found).length < layoutManager.length();
            }
        }, function (x, y) {
            var layout = layoutManager.closest({
                width: x,
                height: y
            });
            return layout.get('name');
        });
        console.log(result);
        result.forEachBorder(function (cell) {
            var id = cell[2];
            context.fillStyle = id === 'none' ? 'black' : layoutManager.find(function (layout) {
                return layout.id === id;
            }).get('color');
            context.fillRect(cell[0] - 1, cell[1] - 1, 1, 1);
        });
    }

    function setCanvasSize() {
        $canvas.prop({
            height: window.innerHeight,
            width: window.innerWidth
        });
        draw();
    }
});