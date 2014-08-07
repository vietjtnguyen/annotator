/*
 * Monolithic view for the application. Initializes D3 behaviors as well.
 */
var AppView = Backbone.View.extend({

  events: {
    "click #resetViewButton": "resetView",
    "click #toggleBgButton": "toggleBg",
    "click #toggleGridButton": "toggleGrid"
  },

  modelEvents: {
    "change:background": "renderBackgroundColor",
    "change:grid": "renderGridVisibility",
    "change:zoom": "renderZoom"
  },

  d3Events: {
    "zoom zoom": "zoomed",
    "zoomend zoom": "zoomend",
    "click clickRect": "canvasClick"
  },

  initialize: function() {
    var self = this;
    self.render();
    self.delegateModelEvents();
    self.delegateD3Events();
  },

  delegateModelEvents: function(modelEvents) {
    var self = this;
    modelEvents = modelEvents === undefined ? self.modelEvents : modelEvents;
    _.forEach(modelEvents, function(callback, trigger) {
      self.model.on(trigger, self[callback], self);
    });
  },

  delegateD3Events: function(d3Events) {
    var self = this;
    d3Events = d3Events === undefined ? self.d3Events : d3Events;
    /*
     * Set up the D3 events such that the this context of the callback is the
     * view itself (instead of the DOM element which is the default D3
     * behavior) and the DOM element is instead passed as the first argument.
     * Thus the callbacks receive three arguments: DOM element, datum, and
     * index. The trigger name is the name of an attribute on self, which
     * should be a D3 selection or behavior, and the D3 event to bind using the
     * `on` method for D3 selections and behaviors.
     */
    _.forEach(d3Events, function(callback, trigger) {
      var triggerArgs = / *(\w+) *(.*)/.exec(trigger);
      self[triggerArgs[2]].on(triggerArgs[1], function(d, i) { self[callback](this, d, i); });
    });
  },

  render: function() {
    var self = this;

    /*
     * Create the actual SVG element and give it a class with 100% width and
     * height CSS properties.
     */
    self.svg = d3.select(self.el)
      .append("svg")
      .classed("workingArea", true);

    /* 
     * Create the zoom behavior. This object is applied to a D3 selection by
     * "calling it" on a D3 selection. If you're confused why I can reference
     * function `zoomed` here even though it is declared below, check out
     * <http://kangax.github.io/nfe/>.
     */
    self.zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 10]);
    /* .on("zoom", callback); /* The callback is bound using `d3events`. */

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
    d3.selectAll(".grid")
      .classed("off", true);

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
    self.clickRect = self.origin.append("rect")
      .attr("x", gridExtent[0])
      .attr("y", gridExtent[1])
      .attr("width", gridExtent[2] - gridExtent[0] + gridSpacing)
      .attr("height", gridExtent[3] - gridExtent[1] + gridSpacing)
      .style("fill", "none")
      .style("pointer-events", "all");
      /* .on("click", callback); /* The callback is bound using `d3events`. */
  },
  resetView: function() {
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
      ix = d3.interpolate(self.zoom.translate()[0], windowSize[0]/2 - self.model.get("currentImage").width/2),
      iy = d3.interpolate(self.zoom.translate()[1], windowSize[1]/2 - self.model.get("currentImage").height/2),
      is = d3.interpolate(self.zoom.scale(), 1);
      /*
       * Return the actual tween function. The function we're current in is a
       * "tween function factory" per the documentation.
       * <https://github.com/mbostock/d3/wiki/Transitions#tween>
       */
      return function(t) {
        /*
         * Set the model's zoom's translation and scale to the interpolated
         * values. The model's change event will trigger `renderZoom` to
         * actually make changes to the DOM.
         */
        self.model.set("zoom", {
          translate: [ix(t), iy(t)],
          scale: is(t)
        });
      }
    }).each("end", function() {
      /*
       * Save the state of the model's zoom at the end of the transition.
       */
      self.zoomend();
    });
  },
  toggleBg: function() {
    var self = this;
    self.model.set("background", self.model.get("background") == "light" ? "dark" : "light");
    self.model.save();
  },
  toggleGrid: function() {
    var self = this;
    self.model.set("grid", self.model.get("grid") == "off" ? "on" : "off");
    self.model.save();
  },
  renderBackgroundColor: function(model, value, options) {
    var body = d3.select("body");
    var grid = d3.selectAll(".grid");
    _.forEach(["light", "dark"], function(i) {
      body.classed(i, value == i);
      grid.classed(i, value == i);
    });
  },
  renderGridVisibility: function(model, value, options) {
    var grid = d3.selectAll(".grid");
    _.forEach(["off", "on"], function(i) {
      grid.classed(i, value == i);
    });
  },
  zoomed: function(domElement, datum, index) {
    var self = this;
    self.model.set("zoom", {
      translate: self.zoom.translate(),
      scale: self.zoom.scale()
    });
  },
  zoomend: function(domElement, datum, index) {
    var self = this;
    self.model.save();
  },
  renderZoom: function(model, value, options) {
    var self = this;
    self.origin.attr("transform", "translate(" + value.translate.toString() + "), scale(" + value.scale + ")");
    self.zoom
      .translate(value.translate)
      .scale(value.scale);
  },
  canvasClick: function(domElement, datum, index) {
    var self = this;
    /* <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> */
    if (d3.event.defaultPrevented) return;
    if (!d3.event.ctrlKey) {
      /* <http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom> */
      var mousePosition = d3.mouse(domElement);
      var newPoint = new Point({x: mousePosition[0], y: mousePosition[1]});
      polyLine.get("points").add(newPoint);
      updateDots();
    }
  }
});
