var PointSetVisView = Backbone.View.extend({

  tagName: "g",

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // The visualization uses D3 for construction so we create the DOM
    // elements with D3 in this function and remember any D3 selections we
    // might need in the future. We put this in an initialize function so that
    // we don't create/remove DOM elements everytime we want to rerender
    // (points are added/removed according to D3 selection joins though). After
    // intialization, rerender everything for good measure.
    self.initializeD3();
    self.render();

    // If the points change at all then we'll want to rerender the repsentation
    // which includes adding/removing points and updating the polygon.
    self.listenTo(self.model, "change:points", self.render);

    // If the model changes its group membership then rerender the selection
    // visual in case we are in group membership mode.
    self.listenTo(self.model, "change:group", self.renderSelection);

    // If the model broadcasts mouseover and mouseout events (probably because
    // the list item was moused over or out and triggered a broadcast) then we
    // want to visually repond accordingly.
    self.listenTo(self.model, "mouseOver", self.forceMouseOver);
    self.listenTo(self.model, "mouseOut", self.forceMouseOut);

    // If the model is starting removal (probably triggered by the list item
    // remove button) then we want to start the visual removal animation. The
    // removal the model itself should be handled by the list item.
    self.listenTo(self.model, "startingRemoval", self.startPrettyRemove);
    
    // If the Backbone model is destroyed then remove this view (self.remove is
    // a Backbone method). Worth noting is that the visualization doesn't
    // trigger any removals on its own. It is wholly dependent on the list item
    // triggering a "startingRemoval" event on the model which is responded to
    // by the above callback. The callback above will remove this view.
    self.listenTo(self.model, "destroy", self.remove);

    // If the application broadcasts a rerender then respond accordingly.
    self.listenTo(self.appState, "rerender", self.render);

    // If the selected point set changes then rerender the selection visual.
    self.listenTo(self.appState, "change:selectedPointSetId", self.renderSelection);

    // If the selected group changes then rerender the selection visual because
    // we might have changed to in/out of group membership mode.
    self.listenTo(self.appState, "change:selectedGroupId", self.renderSelection);

    // If the application changes the line color then we'll want to rerender
    // the line color accordingly.
    self.listenTo(self.appState.userState, "change:lineColor", self.renderLineColor);

    // Responding to D3 events requires special processing. D3 events bind to
    // the DOM element that is responding and pass the datum and index as
    // arguments. Here we wrap such event callbacks so that they are bound to
    // this view and pass the DOM element, datum, and index as arguments. Note
    // this has to come after the `initializeD3` call so that the appropriate
    // D3 selections are available.
    self.delegateD3Events({
      "dragstart drag": "handlePointDragStart",
      "drag drag": "handlePointDrag",
      "dragend drag": "handlePointDragEnd",
      "click bgPolySelection": "selectSelf"
    });
  },

  initializeD3: function() {
    var self = this;

    // Create a group under the origin that all points and polygons will be
    // nested under and cache the D3 selection.
    self.setGroup = d3.select("#origin").append("g")
      .classed("pointSet", true);

    // Set the Backbone view's element to the group created via D3 above.
    self.setElement(self.setGroup.node());

    // Create a D3 drag behavior that will be applied to points and remember a
    // reference to it.
    self.drag = d3.behavior.drag()
      .origin(function(d) { return d; });

    // Create the polygonal visualization of the point set and cache the D3
    // selection.
    self.polySelection = self.setGroup.selectAll(self.model.svgElement)
      .data(["bg", "fg"], function(d, i) { return d; })
      .enter();
    self.polySelection = self.model.appendSvgElement(self.polySelection)
      .classed("polygonBg", function(d, i) { return d == "bg"; })
      .classed("polygonFg", function(d, i) { return d == "fg"; });

    // Add visual hover behavior to just the background polygon and cache the
    // selection.
    self.bgPolySelection = self.polySelection.data(["bg"], function(d, i) { return d; })
      .on("mouseover", function(d, i) {
        d3.select(this)
          .classed("hover", true);
      })
      .on("mouseout", function(d, i) {
        d3.select(this)
          .classed("hover", false);
      });

    // Cache the foreground polygon selection.
    self.fgPolySelection = self.polySelection.data(["fg"], function(d, i) { return d; });

    self.renderLineColor();
  },
  
  // Simply calls all of the other render functions.
  render: function() {
    var self = this;
    self.renderPoints();
    self.renderPoly();
    self.renderLineColor();
    self.renderSelection();
    return self;
  },

  renderPoints: function() {
    var self = this;
    self.dataSelection = self.setGroup.selectAll("circle")
      .data(self.model.get("points"), function(d) { return d.id; });
    self.dataSelection.enter().append("circle")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("r", 5)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; }) // TODO: Add tablet support with offset here.
      .classed("point", true)
      .style({
        "opacity": 0,
        "stroke": self.appState.userState.get("lineColor")
      })
      .on("click", function(d, i) { self.handlePointClick(self, d, i); })
      .on("mouseover", function(d, i) {
        d3.select(this)
          .classed("hover", true)
          .transition().duration(250)
          .attr("r", 10)
          // This opacity transition is needed because the transition started
          // on mouse over can interrupt the transition started on datum enter.
          // Interestingly this isn't a problem in Chrome but is a problem in
          // Firefox.
          .style("opacity", 1)
          .style("fill-opacity", 0)
          .style("stroke", "#f00")
          .style("stroke-opacity", 1);
      })
      .on("mouseout", function(d, i) {
        d3.select(this)
          .classed("hover", false)
          .transition().duration(250)
          .attr("r", 5)
          .style("opacity", 1)
          .style("fill-opacity", 0.1)
          .style("stroke", "#000")
          .style("stroke-opacity", 0.1);
      })
      .call(self.drag)
      .transition()
      .duration(250)
      .style("opacity", 1);
    self.dataSelection.exit()
      .on("click", null)
      .on("mouseover", null)
      .on("mouseout", null)
      .transition()
      .duration(250)
      .style("opacity", 0)
      .remove();
    self.dataSelection = self.setGroup.selectAll("circle");
  },

  renderPoly: function() {
    var self = this;
    self.model.updateSvgElement(self.polySelection);
    // self.polySelection.attr("points", self.model.toSvgCoords());
  },

  renderLineColor: function() {
    var self = this;
    self.fgPolySelection.style("stroke", self.appState.userState.get("lineColor"));
  },

  renderSelection: function() {
    var self = this;
    if ( (self.appState.isInGroupMembershipMode() && self.model.get("group") === self.appState.get("selectedGroupId")) ||
         (!self.appState.isInGroupMembershipMode() && self.model.get(self.model.idAttribute) === self.appState.get("selectedPointSetId")) ) {
      self.polySelection.classed("selected", true);
      self.fgPolySelection.style("stroke", "#00f");
    } else {
      self.polySelection.classed("selected", false);
      self.fgPolySelection.style("stroke", self.appState.userState.get("lineColor"));
    }
  },

  forceMouseOver: function() {
    var self = this;
    self.polySelection
      .classed("hover", true);
  },

  forceMouseOut: function() {
    var self = this;
    self.polySelection
      .classed("hover", false);
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

  startPrettyRemove: function() {
    var self = this;
    d3.select(self.el).transition()
      .duration(250)
      .style("opacity", 0)
      .each("end", function() {
        self.remove();
      });
  },

  selectSelf: function(domElement, datum, index) {
    var self = this;
    self.model.selectSelf();
  },

  handlePointClick: function(domElement, datum, index) {
    var self = this;

    // If we click or drag a point we'll force the selection of the point set
    // instead of toggling it.
    self.model.selectSelf(true);

    // If we enter this if statement then we are not really handling a click
    // but instead handling a drag end. If that's the case then force select
    // this point set and ignore the rest of the click-specific behavior.
    // <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> 
    if (d3.event.defaultPrevented) {
      // self.model.selectSelf(true);
      return;
    }

    // If the control key is held then treat this as a delete action on the
    // point that was control-clicked.
    // TODO: Have a touch friendly method of deletion.
    if (d3.event.ctrlKey) {
      var points = self.model.get("points");
      points.splice(index, 1);
      self.model.trigger("change:points");
      self.model.save();
    }

    // // We're clicking the point set so treat it like a selection action.
    // self.model.selectSelf();
  },

  handlePointDragStart: function(domElement, datum, index) {
    var self = this;
    d3.event.sourceEvent.stopPropagation();
  },

  handlePointDrag: function(domElement, datum, index) {
    var self = this;

    // We modify the point *in-place* which won't trigger a change event so we
    // trigger one manually after. Another way to do this is to get the point
    // array, modify it, and the set it again.
    var point = self.model.get("points")[index];
    point.x = d3.event.x;
    point.y = d3.event.y;
    self.model.trigger("change:points");

    // Update the actual dot visualization.
    d3.select(domElement).attr("cx", point.x).attr("cy", point.y); // TODO: Add tablet support with offset here.
  },

  handlePointDragEnd: function(domElement, datum, index) {
    var self = this;
    self.model.save();
  }

});
