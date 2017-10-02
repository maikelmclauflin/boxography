module.exports = crosses;

function crosses(bounds1, bounds2) {
    if (bounds1.minX > bounds2.maxX) {
        return false;
    } else if (bounds1.maxX < bounds2.minX) {
        return false;
    } else if (bounds1.minY > bounds2.maxY) {
        return false;
    } else if (bounds1.maxY < bounds2.minY) {
        return false;
    } else {
        return true;
    }
}