var AppPresenter = function(model) {
  var self = this;
  self.model = model;

  /*
   * List delegate events.
   */
  delegateEvents = {
    "click #resetViewButton": "resetView",
    "click #toggleBgButton": "toggleBg",
    "click #toggleGridButton": "toggleGrid"
  };

  /*
   * Set up delegate event callbacks.
   */
  _.forEach(delegateEvents, function(callback, trigger) {
    var triggerArgs = / *(\w+) *(.*)/.exec(trigger);
    d3.select(triggerArgs[2]).on(triggerArgs[1], function(d, i) { self[callback](d, i, this); });
  });

  self.initialize();
}

AppPresenter.prototype.initialize = function() {
  var self = this;

  /*
   * Create the actual SVG element and give it a class with 100% width and
   * height CSS properties.
   */
  self.svg = d3.select("body")
    .append("svg")
    .classed("workingArea", true);

  /* 
   * Create the zoom behavior. This object is applied to a D3 selection by
   * "calling it" on a D3 selection. If you're confused why I can reference
   * function `zoomed` here even though it is declared below, check out
   * <http://kangax.github.io/nfe/>.
   */
  self.zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", function() {
        /*
         * This method is wrapped because when D3 calls a callback it binds the
         * callback's this context to the DOM element that triggered the event,
         * this replacing our more useful context with references to other
         * parts of the application.
         */
        self.zoomed();
      });
  /*
   * Create the SVG group element that will take on the zoom behavior.
   */
  self.svgRoot = self.svg.append("g")
    .attr("transform", "translate(0, 0)")
    .call(self.zoom); /* apply the zoom behavior to self selection */

  /*
   * This element acts as the "world origin" in the sense that any elements
   * attached to it are zoomed and panned according to the zoom/pan behaviors
   * defined earlier.
   */
  self.origin = self.svgRoot.append("g")
    .attr("id", "origin");

  /*
   * Create a reference grid with a 10 pixel spacing from -1000 pixels to 1000
   * pixels.
   */
  var gridSpacing = 10,
      gridExtent = [-1000, -1000, 2000, 2000],
      gridRoot = self.origin.append("g");
  gridRoot.selectAll(".xaxis line")
    .data(d3.range(gridExtent[0], gridExtent[2] + gridSpacing, gridSpacing))
    .enter().append("line")
      .classed("grid xaxis light", true)
      .attr("x1", function(d) { return d; })
      .attr("y1", gridExtent[1])
      .attr("x2", function(d) { return d; })
      .attr("y2", gridExtent[2]);
  gridRoot.selectAll(".yaxis line")
    .data(d3.range(gridExtent[1], gridExtent[3] + gridSpacing, gridSpacing))
    .enter().append("line")
      .classed("grid yaxis light", true)
      .attr("x1", gridExtent[0])
      .attr("y1", function(d) { return d; })
      .attr("x2", gridExtent[2])
      .attr("y2", function(d) { return d; });
  self.grid = d3.selectAll(".grid");

  /*
   * This is really annoying. I think I need to know the size of the image before
   * I append it. I can't seem to just append it and anchor it via the top-left
   * without resizing it.
   */
  self.origin.append("svg:image")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", self.model.get("currentImage").get("width"))
    .attr("height", self.model.get("currentImage").get("height"))
    .attr("xlink:href", self.model.get("currentImage").get("url"));

  /*
   * This `clickRect` is the click target for the whole SVG element.
   */
  var clickRect = self.origin.append("rect")
    .attr("x", gridExtent[0])
    .attr("y", gridExtent[1])
    .attr("width", gridExtent[2] - gridExtent[0] + gridSpacing)
    .attr("height", gridExtent[3] - gridExtent[1] + gridSpacing)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("click", self.canvasClick);
};

AppPresenter.prototype.zoomed = function() {
  var self = this;
  self.origin.attr("transform", "translate(" + self.zoom.translate().toString() + "), scale(" + self.zoom.scale() + ")");
};

AppPresenter.prototype.resetView = function(datum, index, elem) {
  var self = this;
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
        ix = d3.interpolate(self.zoom.translate()[0], windowSize[0]/2 - self.model.get("currentImage").get("width")/2),
        iy = d3.interpolate(self.zoom.translate()[1], windowSize[1]/2 - self.model.get("currentImage").get("height")/2),
        is = d3.interpolate(self.zoom.scale(), 1);
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
      self.zoom.translate([ix(t), iy(t)]);
      self.zoom.scale(is(t));
      /*
      * Actually apply these new zoom behavior values to the SVG origin group.
      */
      self.zoomed();
    }
  });
};

AppPresenter.prototype.toggleBg = function() {
  var self = this;
  var body = d3.select("body");
  var grid = d3.selectAll(".grid");
  if (body.style("background-color").indexOf("rgb(0, 0, 0)") > -1 ||
      body.style("background-color").indexOf("#000") > -1 ) {
    body.style("background-color", "rgb(255, 255, 255)");
    grid.classed({"light": true, "dark": false});
  } else {
    body.style("background-color", "rgb(0, 0, 0)");
    grid.classed({"light": false, "dark": true});
  }
};

AppPresenter.prototype.toggleGrid = function() {
  var self = this;
  var grid = d3.selectAll(".grid");
  if (grid.style("display") == "none") {
    grid.style("display", "inline");
  } else {
    grid.style("display", "none");
  }
};

AppPresenter.prototype.canvasClick = function() {
  var self = this;
  /* <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> */
  if (d3.event.defaultPrevented) return;
  if (!d3.event.ctrlKey) {
    /* <http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom> */
    var mousePosition = d3.mouse(this);
    var newPoint = new Point({x: mousePosition[0], y: mousePosition[1]});
    polyLine.get("points").add(newPoint);
    updateDots();
  }
};
