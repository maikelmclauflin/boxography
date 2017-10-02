module.exports = within;

function within(x, y, bounds) {
    return bounds.minX <= x && x <= bounds.maxX && bounds.minY <= y && y <= bounds.maxY;
}