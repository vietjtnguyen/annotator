/*
 * Helpful links:
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
 * http://stackoverflow.com/questions/18504235/understand-backbone-js-rest-calls
 */

/*
 * Backbone.js definitions.
 */

var pointId = 0;

var Application = Backbone.Model.extend({
  "localStorage": new Backbone.LocalStorage("com.vietjtnguyen.annotator.application"),
  "defaults": function() {
    return {
      "activeImage": "2008_000003",
      "zoom": {
        "translate": [0, 0],
        "scale": 1
      }
    };
  },
  "initialize": function() {
  }
});
var application = new Application();

var UtilityView = Backbone.View.extend({
  "events": {
    "click #resetViewButton": "resetView",
    "click #toggleBgButton": "toggleBg"
  },
  "initialize": function() {
    this.listenTo(application, "change", this.render);
    this.resetView();
  },
  "render": function() {
  },
  "resetView": function() {
    resetView();
  },
  "toggleBg": function() {
    var body = d3.select("body");
    if (body.style("background-color").indexOf("rgb(0, 0, 0)") > -1 ||
        body.style("background-color").indexOf("#000") > -1 ) {
      body.style("background-color", "rgb(255, 255, 255)");
      grid.style("stroke", "#eee");
    } else {
      body.style("background-color", "rgb(0, 0, 0)");
      grid.style("stroke", "#222");
    }
  }
});
var utilityView = new UtilityView({"el": $("#utilityView")});

var Image = Backbone.Model.extend({
  "localStorage": new Backbone.LocalStorage("com.vietjtnguyen.annotator.image"),
  "defaults": function() {
    return {
      "name": "",
      "width": 0,
      "height": 0,
      "url": ""
    };
  },
  "initialize": function() {
  },
  "validate": function(attrs, options) {
  }
});

var ImageCollection = Backbone.Collection.extend({
  "localStorage": new Backbone.LocalStorage("com.vietjtnguyen.annotator.images"),
  "model": Image,
  "initialize": function() {
  },
});

var PolyLine = Backbone.Model.extend({
  "localStorage": new Backbone.LocalStorage("com.vietjtnguyen.annotator.polyline"),
  "initialize": function() {
    this.set("points", []);
  },
  "toSvgCoord": function() {
    return _.map(this.get("points"), function(i) { return i.x + "," + i.y; }).join(" ");
  }
});

var imageData = new Image({
  "name": "2008_000003",
  "width": 500,
  "height": 333,
  "url": "../example-data/images/2008_000003.jpg",
  "comment": ""
});

var polyLine = new PolyLine({"id": imageData.get("name")});

/* 
 * Create the zoom behavior. This object is applied to a D3 selection by
 * "calling it" on a D3 selection. If you're confused why I can reference
 * function `zoomed` here even though it is declared below, check out
 * <http://kangax.github.io/nfe/>.
 */
var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", zoomed);

/*
 * Create the drag behavior that lets us drag points around.
 */
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dotDragStarted)
    .on("drag", dotDragged)
    .on("dragend", dotDragEnded);
    
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
    .attr("class", "axis")
  .selectAll("line")
    .data(d3.range(gridExtent[0], gridExtent[2] + gridSpacing, gridSpacing))
  .enter().append("line")
    .attr("x1", function(d) { return d; })
    .attr("y1", gridExtent[1])
    .attr("x2", function(d) { return d; })
    .attr("y2", gridExtent[2]);
origin.append("g")
    .attr("class", "axis")
  .selectAll("line")
    .data(d3.range(gridExtent[1], gridExtent[3] + gridSpacing, gridSpacing))
  .enter().append("line")
    .attr("x1", gridExtent[0])
    .attr("y1", function(d) { return d; })
    .attr("x2", gridExtent[2])
    .attr("y2", function(d) { return d; });
var grid = d3.selectAll("g .axis line")
  .style({
    "fill": "none",
    "stroke": "#eee",
    "shape-rendering": "crispEdges",
    "vector-effect": "non-scaling-stroke"
  });

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
 * This `clickRect` is the click target for the whole SVG element.
 */
var clickRect = origin.append("rect")
  .attr("x", gridExtent[0])
  .attr("y", gridExtent[1])
  .attr("width", gridExtent[2] - gridExtent[0] + gridSpacing)
  .attr("height", gridExtent[3] - gridExtent[1] + gridSpacing)
  .style("fill", "none")
  .style("pointer-events", "all")
  .on("click", canvasClick);

var line = origin.selectAll("polyline")
  .data([{"width": 3, "color": "#fff", "opacity": 0.5, "linecap": "round"},
         {"width": 1, "color": "#000", "opacity": 1, "linecap": "butt"}])
  .enter()
  .append("polyline")
  .attr("fill", "none")
  .attr("points", "")
  .attr("vector-effect", "non-scaling-stroke")
  .attr("stroke", function(d) { return d.color; })
  .attr("stroke-width", function(d) { return d.width; })
  .attr("stroke-linecap", function(d) { return d.linecap; })
  .attr("stroke-linejoin", "round")
  .style("opacity", function(d) { return d.opacity; });
var dot = origin.append("g").attr("class", "dot");
updateDots();

function updateDots() {
  /*
   * <http://bost.ocks.org/mike/circles/>
   * <http://bost.ocks.org/mike/constancy/>
   */
  var dotsSelection = dot.selectAll("circle")
    .data(polyLine.get("points"), function(d) { return d.id; });
  dotsSelection.transition()
    .duration(500)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
  dotsSelection.enter().append("circle")
    /* http://stackoverflow.com/questions/10473328/how-to-draw-non-scalable-circle-in-svg-with-javascript */
    .attr("vector-effect", "non-scaling-stroke")
    .attr("r", 5)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .style({"opacity": 0,
            "stroke-width": "1.5px",
            "stroke": "#000",
            "stroke-opacity": 0.1,
            "fill": "#fff",
            "fill-opacity": 0.1})
    .on("click", dotClick)
    .on("mouseover", function(d, i) {
      d3.select(this).transition().duration(250)
        .attr("r", 10)
        .style("opacity", 1)
        .style("fill-opacity", 0)
        .style("stroke", "#f00")
        .style("stroke-opacity", 1);
    })
    .on("mouseout", function(d, i) {
      d3.select(this).transition().duration(250)
        .attr("r", 5)
        .style("opacity", 1)
        .style("fill-opacity", 0.1)
        .style("stroke", "#000")
        .style("stroke-opacity", 0.1);
    })
    .call(drag)
    .transition()
    .duration(250)
    .style("opacity", 1);
  dotsSelection.exit()
    .on("click", null)
    .on("mouseover", null)
    .on("mouseout", null)
    .transition()
    .duration(250)
    .style("opacity", 0)
    .remove();
  updateLines();
}

function updateLines() {
  line.attr("points", polyLine.toSvgCoord());
}

/*
 * This is the zoom callback which will be called on zoom events. Note that it
 * includes `origin` here via a closure.
 */
function zoomed() {
  origin.attr("transform", "translate(" + zoom.translate().toString() + "), scale(" + zoom.scale() + ")");
}

function dotDragStarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dotDragged(d) {
  d.x = d3.event.x;
  d.y = d3.event.y;
  d3.select(this).attr("cx", d.x).attr("cy", d.y);
  updateLines();
}

function dotDragEnded(d) {
  d3.select(this).classed("dragging", false);
  updateLines();
}

function dotClick(d, i) {
  /* <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> */
  if (d3.event.defaultPrevented) return;
  if (d3.event.ctrlKey) {
    var points = polyLine.get("points");
    /* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift> */
    points.splice(points.indexOf(d), 1);
    updateDots();
  }
}

function canvasClick(d, i) {
  /* <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> */
  if (d3.event.defaultPrevented) return;
  if (!d3.event.ctrlKey) {
    /* <http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom> */
    var mousePosition = d3.mouse(this);
    var newPoint = {"id": pointId += 1, "x": mousePosition[0], "y": mousePosition[1]};
    polyLine.get("points").push(newPoint);
    updateDots();
  }
}

/* 
 * This function returns a two element array containing the "window" width and
 * height respectively.
 * <http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js>
 */
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

d3.select("#saveImageButton").on("click", function(d, i) {
  polyLine.save();
});

d3.select("#openImageButton").on("click", function(d, i) {
  polyLine.fetch({
    "success": function(model, response, options) {
      console.log("fetch success");
      console.log(model);
      console.log(response);
      pointId = _.max(polyLine.get("points"), function(i) { return i.id; });
    },
    "error": function(model, response, options) {
      console.log("fetch fail");
    }
  });
  updateDots();
});
