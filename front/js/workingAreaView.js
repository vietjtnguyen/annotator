var WorkingAreaView = Backbone.View.extend({

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    self.initializeD3();
    
    // If the current image changes somehow then we'll want to rerender the
    // image element in the working area's SVG.
    self.listenTo(self.appState, "change:currentImage", self.renderImage);
    self.listenTo(self.appState.currentImage, "change", self.renderImage);

    // If the background state changes then rerender the background.
    self.listenTo(self.appState, "change:background", self.renderBackgroundColor);

    // If the grid state changes then rerender the grid.
    self.listenTo(self.appState, "change:grid", self.renderGridVisibility);

    // If the zoom (pan and zoom) changes then rerender the zoom (i.e. update
    // the transform on the origin group).
    self.listenTo(self.appState, "change:zoom", self.renderZoom);

    // If the point set collection changes then update the representation views
    // accordingly.
    self.listenTo(self.appState.pointSets, "add", self.addPointSetRepresentationView);

    // Responding to D3 events requires special processing. D3 events bind to
    // the DOM element that is responding and pass the datum and index as
    // arguments. Here we wrap such event callbacks so that they are bound to
    // this view and pass the DOM element, datum, and index as arguments. Note
    // this has to come after the `initializeD3` call so that the appropriate
    // D3 selections are available.
    self.delegateD3Events({
      "zoom zoomBehavior": "zoomed",
      "zoomend zoomBehavior": "zoomend",
      "click clickRect": "canvasClick"
    });
  },

  initializeD3: function() {
    var self = this;

    // Create the zoom behavior. This object is applied to a D3 selection by
    // "calling it" on a D3 selection. The callback is bound using `d3events`
    // and `delegateD3Events`.
    // <http://kangax.github.io/nfe/>.
    self.zoomBehavior = d3.behavior.zoom()
      .scaleExtent([0.5, 10]);

    // Apply the zoom behavior to the entire working area.
    d3.select("#workingArea").call(self.zoomBehavior);

    // Cache the D3 selection for the origin.
    self.origin = d3.select("#origin");

    // Create the pretty but rather useless grid.
    self.createGrid();
  },

  // Create a reference grid with a 10 pixel spacing from -1000 pixels to 1000
  // pixels.
  createGrid: function() {
    var self = this;

    // Specify some grid parameters.
    var gridSpacing = 10,
        gridExtent = [-1000, -1000, 2000, 2000],
        gridRoot = d3.select("#gridLines");

    // Create all of the horizontal lines.
    gridRoot.selectAll(".xaxis line")
      .data(d3.range(gridExtent[0], gridExtent[2] + gridSpacing, gridSpacing))
      .enter().append("line")
      .classed("grid xaxis light", true)
      .attr("x1", function(d) { return d; })
      .attr("y1", gridExtent[1])
      .attr("x2", function(d) { return d; })
      .attr("y2", gridExtent[2]);

    // Create all of the vertical lines.
    gridRoot.selectAll(".yaxis line")
      .data(d3.range(gridExtent[1], gridExtent[3] + gridSpacing, gridSpacing))
      .enter().append("line")
      .classed("grid yaxis light", true)
      .attr("x1", gridExtent[0])
      .attr("y1", function(d) { return d; })
      .attr("x2", gridExtent[2])
      .attr("y2", function(d) { return d; });

    // Initialize the grid as off.
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

  addPointSetRepresentationView: function(newModel) {
    var self = this;

    // Create the new representation view.
    var newView = new PointSetRepresentationView({appState: self.appState, model: newModel});

    // Use jQuery to append the representation element to the origin. Why not
    // D3? I dunno, because Backbone uses jQuery.
    self.$("#origin").append(newView.render().el);
  },

  // Simply calls all of the other render functions.
  render: function() {
    var self = this;
    self.renderImage();
    self.renderBackgroundColor();
    self.renderGridVisibility();
    self.renderZoom();
  },

  // "Renders" the image by updating the `svg:image` element with the current
  // image's width, height, and URL. This is a callback to
  // AppState:changed:currentImage.
  renderImage: function(model, value, options) {
    var self = this;
    self.origin.select("image")
      .attr("width", self.appState.currentImage.get("width"))
      .attr("height", self.appState.currentImage.get("height"))
      .attr("xlink:href", self.appState.currentImage.get("url"));
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
    self.zoomBehavior
      .translate(value.translate)
      .scale(value.scale);
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  zoomed: function(domElement, datum, index) {
    var self = this;
    self.appState.set("zoom", {
      translate: self.zoomBehavior.translate(),
      scale: self.zoomBehavior.scale()
    });
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  zoomend: function(domElement, datum, index) {
    var self = this;
    self.appState.save();
  },

  // This is a D3 event hooked into the view using `delegateD3Event`.
  canvasClick: function(domElement, datum, index) {
    var self = this;

    // <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> 
    if (d3.event.defaultPrevented) {
      return;
    }

    // A Ctrl+Click is considered a point removal operation so ignore it in
    // this case.
    if (!d3.event.ctrlKey) {

      // <http://stackoverflow.com/questions/10247209/d3-click-coordinates-are-relative-to-page-not-svg-how-to-translate-them-chrom> 
      var mousePosition = d3.mouse(domElement);

      // Trigger an event off the view that other things will listen for.
      self.trigger("workingAreaClick", mousePosition);
    }
  }

});
