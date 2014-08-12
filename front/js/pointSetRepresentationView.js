var PointSetRepresentationView = Backbone.View.extend({

  tagName: "g",

  initialize: function() {
    var self = this;
    self.listenTo(self.model, "change:points", self.render);
    self.listenTo(self.model, "changeLineColor", self.renderLineColor);
    self.listenTo(self.model, "select", self.renderSelection);
    self.listenTo(self.model, "unselect", self.renderUnselection);
    self.listenTo(self.model, "removing", self.startRemoval);
    self.listenTo(self.model, "destroy", self.remove);
    self.initialRender();
    self.delegateD3Events({
      "dragstart drag": "dotDragStarted",
      "drag drag": "dotDragged",
      "dragend drag": "dotDragEnded",
      "click bgPolySelection": "polyClick"
    });
    self.render();
  },

  initialRender: function() {
    var self = this;
    self.setGroup = d3.select("#origin").append("g")
      .classed("pointSet", true);
    self.drag = d3.behavior.drag()
      .origin(function(d) { return d; });
    self.setElement(self.setGroup.node());
    self.polySelection = self.setGroup.selectAll("polygon")
      .data(["bg", "fg"], function(d, i) { return d; })
      .enter()
      .append("polygon")
      .classed("polygonBg", function(d, i) { return d == "bg"; })
      .classed("polygonFg", function(d, i) { return d == "fg"; });
    self.bgPolySelection = self.polySelection.data(["bg"], function(d, i) { return d; })
      .on("mouseover", function(d, i) {
        d3.select(this)
          .classed("hover", true);
      })
      .on("mouseout", function(d, i) {
        d3.select(this)
          .classed("hover", false);
      });
    self.fgPolySelection = self.polySelection.data(["fg"], function(d, i) { return d; });

    self.renderLineColor()
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

  startRemoval: function() {
    var self = this;
    d3.select(self.el).transition()
      .duration(250)
      .style("opacity", 0);
  },
  
  render: function() {
    var self = this;
    self.dataSelection = self.setGroup.selectAll("circle")
      .data(self.model.get("points"), function(d) { return d.id; });
    self.dataSelection.enter().append("circle")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("r", 5)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .classed("point", true)
      .style({
        "opacity": 0,
        "stroke": appState.get("lineColor")
      })
      .on("click", function(d, i) { self.dotClick(self, d, i); })
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
    self.polySelection.attr("points", self.model.toSvgCoords());

    return self;
  },

  renderLineColor: function() {
    var self = this;
    self.fgPolySelection.style("stroke", appState.get("lineColor"));
  },

  renderSelection: function() {
    var self = this;
    self.polySelection.classed("selected", true);
    self.fgPolySelection.style("stroke", "#00f");
  },

  renderUnselection: function() {
    var self = this;
    self.polySelection.classed("selected", false);
    self.fgPolySelection.style("stroke", appState.get("lineColor"));
  },

  polyClick: function() {
    var self = this;
    self.collection.select(self.model);
  },

  dotClick: function(domElement, datum, index) {
    var self = this;
    console.log("dotClick");
    console.log(datum);
    console.log(index);
    // <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> 
    if (d3.event.defaultPrevented) return;
    if (d3.event.ctrlKey) {
      var points = self.model.get("points");
      points.splice(points.indexOf(datum), 1);
      self.model.trigger("change:points");
      self.model.save();
    }
    self.collection.select(self.model);
  },

  dotDragStarted: function(domElement, datum, index) {
    var self = this;
    d3.event.sourceEvent.stopPropagation();
    d3.select(domElement).classed("dragging", true);
    self.collection.select(self.model);
  },

  dotDragged: function(domElement, datum, index) {
    var self = this;
    datum.x = d3.event.x;
    datum.y = d3.event.y;
    self.model.trigger("change:points");
    d3.select(domElement).attr("cx", datum.x).attr("cy", datum.y);
  },

  dotDragEnded: function(domElement, datum, index) {
    var self = this;
    console.log("dotDragEnded");
    console.log(datum);
    console.log(index);
    d3.select(domElement).classed("dragging", false);
    self.model.save();
  }

});
