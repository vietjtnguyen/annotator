var WorkingAreaView = Backbone.View.extend({

  initialize: function() {
    var self = this;
    self.create();
    self.listenTo(self.model.currentImage, "change", self.renderImage);
    self.listenTo(self.model, "change:background", self.renderBackgroundColor);
    self.listenTo(self.model, "change:grid", self.renderGridVisibility);
    self.listenTo(self.model, "change:zoom", self.renderZoom);
    self.listenTo(self.collection, "add", self.addItemView);
    self.listenTo(self.collection, "reset", self.addAllItemViews);
    self.delegateD3Events({
      "zoom zoom": "zoomed",
      "zoomend zoom": "zoomend",
      "click clickRect": "canvasClick"
    });
  },

  create: function() {
    var self = this;
    // Create the zoom behavior. This object is applied to a D3 selection by
    // "calling it" on a D3 selection. The callback is bound using `d3events`
    // and `delegateD3Events`.
    // <http://kangax.github.io/nfe/>.
    self.zoom = d3.behavior.zoom()
      .scaleExtent([0.5, 10]);
    self.origin = d3.select("#origin");
    d3.select("#workingArea").call(self.zoom); // Apply the zoom behavior to selection 
    self.createGrid();
  },

  // Create a reference grid with a 10 pixel spacing from -1000 pixels to 1000
  // pixels.
  createGrid: function() {
    var self = this;
    var gridSpacing = 10,
        gridExtent = [-1000, -1000, 2000, 2000],
        gridRoot = d3.select("#gridLines");
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
    // This `clickRect` is the click target for the whole SVG element.
    self.clickRect = self.origin.append("rect")
      .attr("x", gridExtent[0])
      .attr("y", gridExtent[1])
      .attr("width", gridExtent[2] - gridExtent[0] + gridSpacing)
      .attr("height", gridExtent[3] - gridExtent[1] + gridSpacing)
      .style("fill", "none")
      .style("pointer-events", "all");
  },

  // This function sets up the view to listen to the model based on events and
  // callbacks listed in `modelEvents`.
  delegateModelEvents: function(modelEvents) {
    var self = this;
    modelEvents = modelEvents || self.modelEvents;
    _.forEach(modelEvents, function(callback, trigger) {
      self.listenTo(self.model, trigger, self[callback]);
    });
  },

  // Set up the D3 events such that the this context of the callback is the
  // view itself (instead of the DOM element which is the default D3 behavior)
  // and the DOM element is instead passed as the first argument.  Thus the
  // callbacks receive three arguments: DOM element, datum, and index. The
  // trigger name is the name of an attribute on self, which should be a D3
  // selection or behavior, and the D3 event to bind using the `on` method for
  // D3 selections and behaviors. The specifications for D3 events is listed in
  // `d3Events`.
  delegateD3Events: function(d3Events) {
    var self = this;
    d3Events = d3Events || self.d3Events;
    _.forEach(d3Events, function(callback, trigger) {
      var triggerArgs = / *(\w+) *(.*)/.exec(trigger);
      var eventName = triggerArgs[1];
      var eventTarget = triggerArgs[2];
      self[eventTarget].on(eventName, function(d, i) { self[callback](this, d, i); });
    });
  },

  addItemView: function(newModel) {
    console.log("workingAdd");
    var self = this;
    var newView = new PointSetRepresentationView({model: newModel, collection: self.collection});
    self.$("#origin").append(newView.render().el);
  },

  addAllItemViews: function() {
    console.log("workingAddAll");
    var self = this;
    self.collection.forEach(self.addItem, self);
  },

  // "Renders" the image by updating the `svg:image` element with the current
  // image's width, height, and URL. This is a callback to
  // AppState:changed:currentImage.
  renderImage: function(model, value, options) {
    var self = this;
    self.origin.select("image")
      .attr("width", self.model.currentImage.get("width"))
      .attr("height", self.model.currentImage.get("height"))
      .attr("xlink:href", self.model.currentImage.get("url"));
  },

  // "Renders" the background color by updating the body and grid classes.
  renderBackgroundColor: function(model, value, options) {
    var body = d3.select("body");
    var grid = d3.selectAll(".grid");
    _.forEach(["light", "dark"], function(i) {
      body.classed(i, value == i);
      grid.classed(i, value == i);
    });
  },

  // "Renders" the grid by updating the grid classes.
  renderGridVisibility: function(model, value, options) {
    var grid = d3.selectAll(".grid");
    _.forEach(["off", "on"], function(i) {
      grid.classed(i, value == i);
    });
  },

  // "Renders" the zoom by updating the origin transform.
  renderZoom: function(model, value, options) {
    var self = this;
    self.origin.attr("transform", "translate(" + value.translate.toString() + "), scale(" + value.scale + ")");
    self.zoom
      .translate(value.translate)
      .scale(value.scale);
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  zoomed: function(domElement, datum, index) {
    var self = this;
    self.model.set("zoom", {
      translate: self.zoom.translate(),
      scale: self.zoom.scale()
    });
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  zoomend: function(domElement, datum, index) {
    var self = this;
    self.model.save();
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  canvasClick: function(domElement, datum, index) {
    var self = this;
    // <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> 
    if (d3.event.defaultPrevented) return;
    if (!d3.event.ctrlKey) {
      // <http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom> 
      var mousePosition = d3.mouse(domElement);
      // Trigger an event off the view that other things will listen for.
      self.trigger("workingAreaClick", mousePosition);
    }
  }

});
