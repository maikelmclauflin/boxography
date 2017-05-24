specless.scope().run(global, function (module, app, _, factories, $) {
    var $canvas = $('#canvas'),
        layoutManager = factories.LayoutManager(),
        context = $canvas.element().getContext('2d');
    $(window).on('resize', setCanvasSize);
    layoutManager.add(window.layoutdata);
    setCanvasSize();

    function draw() {
        var polygons = boxography(layoutManager);
        polygons.scaled.forEach(rectangle);
        polygons.intersections.forEach(function (x_, y_, point) {
            var x = x_;
            var y = y_;
            crosshairs(x, y);
            var a = point.a;
            var b = point.b;
            var amax = polygons.scaled.byId[a].max;
            var bmax = polygons.scaled.byId[b].max;
            var xmax = Math.max(amax[0], bmax[0]);
            var ymax = Math.max(amax[1], bmax[1]);
            var maxslope = ymax / xmax;
            var slope = y / x;
            if (maxslope > slope) {
                // it's going to hit x first
                x = xmax;
                y = slope * xmax;
            } else {
                // it's going to hit y first
                y = ymax;
                x = ymax / slope;
            }
            line(0, 0, x, y);
        });
        layoutManager.forEach(function (layout, index) {
            square(layout.midpointWidth(), layout.midpointHeight(), layout.minWidth() - layout.maxWidth(), layout.minHeight() - layout.maxHeight());
            var target, i = index + 1;
            while (i < layoutManager.length()) {
                target = layoutManager.item(i);
                line(layout.midpointWidth(), layout.midpointHeight(), target.midpointWidth(), target.midpointHeight());
                i += 1;
            }
        });
    }

    function square(x, y, w_, h_, color_) {
        var w = w_ || 13,
            h = h_ || 13,
            halfwidth = Math.floor(w / 2),
            halfheight = Math.floor(h / 2),
            x_ = x - halfwidth,
            y_ = y - halfheight,
            x__ = x + halfwidth,
            y__ = y + halfheight,
            color = color_ || 'black';
        context.fillStyle = color;
        rectangle(x_, y_, x__, y__);
    }

    function rectangle(x_, y_, x__, y__) {
        line(x_, y_, x_, y__);
        line(x_, y__, x__, y__);
        line(x__, y__, x__, y_);
        line(x__, y_, x_, y_);
    }

    function crosshairs(x, y, w_, h_, color_) {
        var w = w_ || 13,
            h = h_ || 13,
            halfwidth = Math.floor(w / 2),
            halfheight = Math.floor(h / 2),
            x_ = x - halfwidth,
            y_ = y - halfheight,
            x__ = x_,
            y__ = y_,
            color = color_ || 'black';
        context.fillStyle = color;
        line(x, y_, x, y_ + h);
        line(x_, y, x_ + w, y);
    }

    function line(x1, y1, x2, y2) {
        context.beginPath();
        context.moveTo(Math.round(x1), Math.round(y1));
        context.lineTo(Math.round(x2), Math.round(y2));
        context.stroke();
    }

    function setCanvasSize() {
        $canvas.prop({
            height: window.innerHeight,
            width: window.innerWidth
        });
        draw();
    }
});