# @specless/boxography

```bash
npm install
npm run build
open html/points.test.html
```

The layout was created in order to simplify the process of defining an area where a given set of css should be applied. The definition of a layout has been iterated over and simplified to create the most comprehensive and simple understanding to date. However, communicating this effectively to users of layouts is difficult as it is still an abstract and computed idea. This project serves as a bridge for users to understand layouts as they are computed, by means of visualization.

In order to create visualizations for the area a layout will be active we have to know what polygon the layout can be active in and what polygons the layout will not be active due to interactions with other layouts.

Layouts create a singular rectangle of possible area that the layout can be active in through it's height, width, minHeight, minWidth, maxHeight, maxWidth, minScale, and maxScale properties. This area is then culled down by the minAspect and maxAspect values leaving at minimum a rectangle and at maximum a hexagonal polygon. The starting rectangle is held in the `bounds` property. The layout can be culled further through interactions from any other layout on the same plane that crosses into the minimum and maximum bounds of the layout. These interactions are held in the `losses` property of the resulting structure.

This project is currently under development, so if the data that is input is changed in `html/src/layoutsbackup.js` it may not compute the correct results, or any at all for that matter.

In addition to checking the correctness of each piece while in every permutation, more work is needed to abstract the computations that are created in the areas of media or rather context query conversion, as well as polygon compositing.

The worthwhileness of this project and what it should accomplish should also be questioned.
