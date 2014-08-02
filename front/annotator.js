/*
 * http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
 * http://stackoverflow.com/questions/6942785/browsers-think-differently-about-window-innerwidth-and-document-documentelement
 * http://bl.ocks.org/mbostock/3892928
 * http://bl.ocks.org/mbostock/6123708
 * http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend
 * http://getbootstrap.com/css
 * http://getbootstrap.com/components
 * http://backbonejs.org/#Model
 * http://backbonejs.org/#Collection
 * http://backbonejs.org/#FAQ-nested
 */

var w = window,
    d = document,
    e = d.documentElement;

/*
 * Create some fake data.
 */
dotData =
  [
    {"id": 1,  "x": 100, "y": 80},
    {"id": 2,  "x": 80,  "y": 69},
    {"id": 3,  "x": 130, "y": 75},
    {"id": 4,  "x": 90,  "y": 88},
    {"id": 5,  "x": 110, "y": 83},
    {"id": 6,  "x": 140, "y": 99},
    {"id": 7,  "x": 60,  "y": 72},
    {"id": 8,  "x": 40,  "y": 42},
    {"id": 9,  "x": 120, "y": 108},
    {"id": 10, "x": 70,  "y": 48},
    {"id": 11, "x": 50,  "y": 56},
  ];

/*
 * Create our Backbone.js Image model.
 */
var Image = Backbone.Model.extend({
  /*
   * This function returns the default attributes for an image.
   */
  defaults: function() {
    return {
      "name": "",
      "width": 0,
      "height": 0,
      "url": ""
    };
  },
  /*
   * This function validates our model and returns an error string if there is
   * a validation failure.
   */
  validate: function(attrs, options) {
  }
});

var imageData = new Image({
  "name": "2008_000003",
  "width": 500,
  "height": 333,
  "url": "../example-data/images/2008_000003.jpg",
  "comment": ""
});


/* 
 * Create the zoom behavior. This object is applied to a D3 selection by
 * "calling it" on a D3 selection. If you're confused why I can reference
 * function `zoomed` here even though it is declared below, check out
 * <http://kangax.github.io/nfe/>.
 */
var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", zoomed);

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);
    
/*
 * This is needed to get the canvas to stretch on Firefox.
 */
d3.select("html")
    .style({"width": "100%", "height": "100%"});

/*
 * Set up the rest of the DOM for a full window SVG "viewport" and remember the
 * SVG selection.
 */
var svg = d3.select("body")
    .style({"margin": "0px", "width": "100%", "height": "100%"})
  .append("div")
    .style({"width": "100%", "height": "100%"})
  .append("svg")
    .style({"width": "100%", "height": "100%"});

/*
 * Create the SVG group element that will take on the zoom behavior.
 */
var svgRoot = svg.append("g")
  .attr("transform", "translate(0, 0)")
  .call(zoom); /* apply the zoom behavior to this selection */

/*
 * This element acts as the "world origin" in the sense that any elements
 * attached to it are zoomed and panned according to the zoom/pan behaviors
 * defined earlier.
 */
var origin = svgRoot.append("g");

/*
 * Create a reference grid with a 10 pixel spacing from -1000 pixels to 1000
 * pixels.
 */
var gridSpacing = 10,
    gridExtent = [-1000, -1000, 2000, 2000];
origin.append("g")
    .attr("class", "x axis")
  .selectAll("line")
    .data(d3.range(gridExtent[0], gridExtent[2] + gridSpacing, gridSpacing))
  .enter().append("line")
    .attr("x1", function(d) { return d; })
    .attr("y1", gridExtent[1])
    .attr("x2", function(d) { return d; })
    .attr("y2", gridExtent[2]);
origin.append("g")
    .attr("class", "y axis")
  .selectAll("line")
    .data(d3.range(gridExtent[1], gridExtent[3] + gridSpacing, gridSpacing))
  .enter().append("line")
    .attr("x1", gridExtent[0])
    .attr("y1", function(d) { return d; })
    .attr("x2", gridExtent[2])
    .attr("y2", function(d) { return d; });

/*
 * This is really annoying. I think I need to know the size of the image before
 * I append it. I can't seem to just append it and anchor it via the top-left
 * without resizing it.
 */
origin.append("svg:image")
  .attr("x", "0")
  .attr("y", "0")
  .attr("width", imageData.get("width"))
  .attr("height", imageData.get("height"))
  .attr("xlink:href", imageData.get("url"));

/*
 * This `rect` is the click target for the whole SVG element.
 */
var rect = origin.append("rect")
  .attr("x", gridExtent[0])
  .attr("y", gridExtent[1])
  .attr("width", gridExtent[2] - gridExtent[0] + gridSpacing)
  .attr("height", gridExtent[3] - gridExtent[1] + gridSpacing)
  .style("fill", "none")
  .style("pointer-events", "all")
  .on("click", mouseclick);

// dot = origin.append("g")
//     .attr("class", "dot")
//   .selectAll("circle")
//     .data(dotData)
//   .enter().append("circle")
//     /* http://stackoverflow.com/questions/10473328/how-to-draw-non-scalable-circle-in-svg-with-javascript */
//     .attr("vector-effect", "non-scaling-stroke")
//     .attr("r", 5)
//     .attr("cx", function(d) { return d.x; })
//     .attr("cy", function(d) { return d.y; })
//     .call(drag);

dot = origin.append("g").attr("class", "dot");
updateDots();

function updateDots() {
  dot.selectAll("circle")
    .data(dotData)
  .enter().append("circle")
    /* http://stackoverflow.com/questions/10473328/how-to-draw-non-scalable-circle-in-svg-with-javascript */
    .attr("vector-effect", "non-scaling-stroke")
    .attr("r", 5)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .call(drag);
}

/* This is the zoom callback which will be called on zoom events. Note that it
 * includes `origin` here via a closure.
 */
function zoomed() {
  //origin.attr("transform", "translate(" + d3.event.translate + "), scale(" + d3.event.scale + ")");
  origin.attr("transform", "translate(" + zoom.translate().toString() + "), scale(" + zoom.scale() + ")");
}

function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("dragging", false);
}

function mouseclick(d, i) {
  /* http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend */
  if (d3.event.defaultPrevented) return;
  /* http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom */
  var mousePosition = d3.mouse(this);
  dotData.push({
    "id": 1,
    "x": mousePosition[0],
    "y": mousePosition[1]
  });
  updateDots();
}

/* This function returns a two element array containing the "window" width and
 * height respectively.
 * http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js */
function getWindowSize() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0];
    return [w.innerWidth || e.clientWidth || g.clientWidth,
            w.innerHeight || e.clientHeight || g.clientHeight];
}

function resetView(d, i) {
  /*
   * Create a D3 transition, not associated with any selection, set its
   * duration to 400 millisecs, and create a custom tweening function.
   */
  d3.transition().duration(400).tween("zoom", function() {
    /*
     * Create value interpolators that will be used by the actual tweening
     * function (available via closure) to interpolate the translation and
     * scale of the zoom behvaior.
     */
    var windowSize = getWindowSize(),
        ix = d3.interpolate(zoom.translate()[0], windowSize[0]/2 - imageData.get("width")/2),
        iy = d3.interpolate(zoom.translate()[1], windowSize[1]/2 - imageData.get("height")/2),
        is = d3.interpolate(zoom.scale(), 1);
    /*
     * Return the actual tween function. The function we're current in is a
     * "tween function factory" per the documentation.
     * <https://github.com/mbostock/d3/wiki/Transitions#tween>
     */
    return function(t) {
      /*
       * Set the zoom behavior's translation and scale to the interpolated
       * values.
       */
      zoom.translate([ix(t), iy(t)]);
      zoom.scale(is(t));
      /*
       * Actually apply these new zoom behavior values to the SVG origin group.
       */
      zoomed();
    }
  });
}

d3.select("#resetButton").on("click", resetView);
resetView();
