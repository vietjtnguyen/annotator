// Helpful links:
// http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
// http://stackoverflow.com/questions/6942785/browsers-think-differently-about-window-innerwidth-and-document-documentelement
// http://bl.ocks.org/mbostock/3892928
// http://bl.ocks.org/mbostock/6123708
// http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend
// http://getbootstrap.com/css
// http://getbootstrap.com/components
// http://backbonejs.org/#Model
// http://backbonejs.org/#Collection
// http://backbonejs.org/#FAQ-nested
// http://stackoverflow.com/questions/18504235/understand-backbone-js-rest-calls
// http://jstarrdewar.com/blog/2012/07/20/the-correct-way-to-override-concrete-backbone-methods/
// https://github.com/mbostock/d3/wiki/Selections#animation--interaction
//   The `this` context of an event callback in D3 is the DOM element.
// http://stackoverflow.com/questions/19851171/nested-backbone-model-results-in-infinite-recursion-when-saving
// http://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach
// http://stackoverflow.com/questions/1834642/best-practice-for-semicolon-after-every-function-in-javascript
// http://www.erichynds.com/blog/backbone-and-inheritance

////////////////////////////////////////////////////////////////////////////////

// This function returns a two element array containing the "window" width and
// height respectively.
// <http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js>
function getWindowSize() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0];
    return [w.innerWidth || e.clientWidth || g.clientWidth,
            w.innerHeight || e.clientHeight || g.clientHeight];
};

// Generate a pseudo-GUID by concatenating random hexadecimal. Taken from
// `backbone.localStorage.js`.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

////////////////////////////////////////////////////////////////////////////////

// Constructs a simple 2D point object.
var Point = function(hash) {
  var self = this;
  _.extend(self, {id: "", x: 0, y: 0}, hash);
};

// Formats the points into a coordinate string suitable for SVG coordinates.
// This amounts to the `x` and `y` attributes represented in a comma delimited
// string.
Point.prototype.toSvgCoord = function() {
  var self = this;
  return self.x.toString() + "," + self.y.toString();
};

////////////////////////////////////////////////////////////////////////////////

// The point set is a simple Backbone Model that contains one attribute: an
// array of point objects. The point set generalizes many different discrete
// annotation types including lines, polylines, polygons, and bounding boxes.
var PointSet = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.PointSet"),

  // Make sure that the point set starts off with an empty array of points.
  defaults: {
    points: []
  },

  parse: function(response) {
    response.points = _.map(response.points, function(i) { return new Point(i); });
    return response;
  },

  // Converts the points stored by the model into a string of coordinates
  // suitable for an SVG `points` attribute (such as on `polyline` and
  // `polygon`).
  toSvgCoords: function() {
    // <http://underscorejs.org/#invoke> 
    return _.invoke(this.get("points"), "toSvgCoord").join(" ");
  },

  validate: function() {
  },

  isFull: function() {
    console.log("wrong");
    return false;
  }

});

var Line = PointSet.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Line"),

  validate: function() {
    var self = this;
    if (self.get("points").length > 2) {
      return "line has " + self.get("points").length + " points, can only have at most two.";
    }
  },

  isFull: function() {
    console.log("right");
    var self = this;
    return self.get("points").length >= 2;
  }

});

////////////////////////////////////////////////////////////////////////////////

// The point set collection is a simple Backbone Collection that holds many
// point sets. It represents the essential data structure for an annotation for
// a single image. For example, a point set represents a bounding box and an
// image's annotation is a collection of bounding boxes. For interactive
// purposes the collection also remembers a selection of one of its point sets.
// This selection is used to determine the target model of operations such as
// adding points.
var PointSetCollection = Backbone.Collection.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.PointSet"),

  model: Line,

  initialize: function() {
    var self = this;
    self.selectedPointSet = null;
    self.on("add", self.saveNewModel);
  },

  saveNewModel: function(model, collection, options) {
    console.log("saveNewModel");
    model.save();
  },

  isSelected: function(model) {
    var self = this;
    return model == this.selectedPointSet;
  },

  select: function(model) {
    var self = this;
    var lastSelectedPointSet = self.selectedPointSet;
    self.selectedPointSet = model || null;
    if (self.selectedPointSet != lastSelectedPointSet) {
      if (lastSelectedPointSet) {
        lastSelectedPointSet.trigger("unselect");
      }
      if (self.selectedPointSet) {
        self.selectedPointSet.trigger("select");
      }
    }
    self.trigger("select", self.selectedPointSet);
  },

  unselect: function() {
    var self = this;
    if (self.selectedPointSet) {
      self.selectedPointSet.trigger("unselect");
    }
    self.selectedPointSet = null;
    self.trigger("select", self.selectedPointSet);
  },

  getSelected: function() {
    var self = this;
    return self.selectedPointSet;
  }

});

////////////////////////////////////////////////////////////////////////////////

var PointSetListItemView = Backbone.View.extend({

  template: _.template($("#pointSetItemTemplate").html()),

  tagName: "a",

  events: {
    "click": "selectItem",
    "click .glyphicon-remove": "removeItem"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "remove", self.renderIndex);
    self.listenTo(self.collection, "select", self.renderSelection);
    self.listenTo(self.model, "change:points", self.renderIndex);
    self.listenTo(self.model, "destroy", self.remove);
  },

  render: function() {
    var self = this;
    self.setElement($(self.template({index: self.collection.indexOf(self.model)}))[0]);
    self.renderSelection();
    return self;
  },

  renderIndex: function() {
    var self = this;
    self.$("#text").html("Line " + self.collection.indexOf(self.model) + "(" + _.map(_.range(self.model.get("points").length), function() { return "."; }).join("") + ")");
    return self;
  },

  renderSelection: function(selectedModel) {
    var self = this;
    if (self.model == selectedModel) {
      self.$el.addClass("active");
    } else {
      self.$el.removeClass("active");
    }
  },

  selectItem: function() {
    var self = this;
    if (self.collection.isSelected(self.model)) {
      self.collection.unselect();
    } else {
      self.collection.select(self.model);
    }
  },

  removeItem: function() {
    var self = this;
    // Trigger this event to notify others that removal has started.
    self.model.trigger("removing");
    // This gets us a nice and smooth removal animation in two steps. First is
    // fades out the element, then it moves the element up using `margin-top`
    // in order to slide all subsequent elements into their new positions.
    d3.select(self.el).transition()
      .duration(250)
      .style("opacity", 0)
      .each("end", function() {
        var selection = d3.select(self.el);
        var origHeight = selection.node().getBoundingClientRect().height;
        selection.transition()
          .duration(250)
          .style("margin-top", -origHeight+"px")
          .each("end", function() {
            // Model destruction also removes the model from the collection
            // (PointSetCollection) that it is a part of.
            self.model.destroy();
          });
      });
  }

});

var PointSetListView = Backbone.View.extend({

  events: {
    "click #addLineButton": "addItem"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "add", self.addItemView);
    self.listenTo(self.collection, "reset", self.addAllItemViews);
  },

  addItem: function() {
    console.log("addItem");
    var self = this;
    var newPointSet = new self.collection.model()
    self.collection.add(newPointSet);
    self.collection.select(newPointSet);
  },

  addItemView: function(newModel) {
    console.log("addItemView");
    var self = this;
    var newView = new PointSetListItemView({model: newModel, collection: self.collection});
    self.$("#lineListing").append(newView.render().el);
  },

  addAllItemViews: function() {
    console.log("addAllItemViews");
    var self = this;
    self.collection.forEach(self.addItemView, self);
  }

});

////////////////////////////////////////////////////////////////////////////////

var PointSetRepresentationView = Backbone.View.extend({

  tagName: "g",

  initialize: function() {
    var self = this;
    self.listenTo(self.model, "change:points", self.render);
    self.listenTo(self.model, "select", self.renderSelection);
    self.listenTo(self.model, "unselect", self.renderUnselection);
    self.listenTo(self.model, "removing", self.startRemoval);
    self.listenTo(self.model, "destroy", self.remove);
    self.initialRender();
    self.delegateD3Events({
      "dragstart drag": "dotDragStarted",
      "drag drag": "dotDragged",
      "dragend drag": "dotDragEnded"
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
      .data(["bg", "fg"])
      .enter()
      .append("polygon")
      .classed("polygonBg", function(d, i) { return d == "bg"; })
      .classed("polygonFg", function(d, i) { return d == "fg"; });
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
      .style("opacity", 0)
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

  renderSelection: function() {
    var self = this;
    self.polySelection.classed("selected", true);
  },

  renderUnselection: function() {
    var self = this;
    self.polySelection.classed("selected", false);
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

////////////////////////////////////////////////////////////////////////////////

// This model represents an image along with its meta data (width, height,
// actual URL, etc.). The images are separate from the annotations because
// multiple annotations can exist for each image.
var Image = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Image"),

  defaults: {
    width: 0,
    height: 0,
    url: ""
  }

});

////////////////////////////////////////////////////////////////////////////////

var AppState = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.AppState"),

  defaults: {
    id: 0,
    currentImage: null,
    currentAnnotation: null,
    currentSet: null,
    background: "light",
    grid: "off",
    zoom: {
      translate: [0, 0],
      scale: 1
    }
  }

});

////////////////////////////////////////////////////////////////////////////////

var WorkingAreaView = Backbone.View.extend({

  initialize: function() {
    var self = this;
    self.create();
    self.listenTo(self.model, "change:currentImage", self.renderImage);
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

////////////////////////////////////////////////////////////////////////////////

var appState = new AppState();

// Attach the current image model to the application state but not as a model
// attribute.
appState.currentImage = new Image();

// Attach the point set to the application state but not as a model attribute.
appState.pointSets = new PointSetCollection({model: Line});

// We want to the current image *model* to listen to changes in the
// `currentImage` attribute on the application state so that the current image
// model can update via a fetch accordingly.
appState.currentImage.listenTo(appState, "change:currentImage", function() {
  appState.currentImage
    .set("id", appState.get("currentImage"))
    .fetch();
});

var workingAreaView = new WorkingAreaView({model: appState, collection: appState.pointSets, el: $("body")[0]});
var utilityBoxView = new UtilityBoxView({model: appState, el: $("#utilityBox")[0]});
var listingView = new PointSetListView({collection: appState.pointSets, el: $("#lineControlSection")[0]});

// Have the point set listen to the working area view for any "canvas clicks"
// to know when to add points to the selected point set.
appState.pointSets.listenTo(workingAreaView, "workingAreaClick", function(mousePosition) {
  console.log("pointSet workingAreaClick");
  console.log(mousePosition);
  var activePointSet = appState.pointSets.getSelected();
  if (!activePointSet || activePointSet.isFull()) {
    activePointSet = new appState.pointSets.model()
    appState.pointSets.add(activePointSet);
    appState.pointSets.select(activePointSet );
  }
  if (activePointSet) {
    var point = new Point({
      id: guid(),
      x: mousePosition[0],
      y: mousePosition[1]
    });
    var points = activePointSet.get("points");
    activePointSet.set("points", _.union(points, [point]))
    activePointSet.save();
  }
});

// Fetch after all hooks have been established!

// Grab the application state if it was saved locally.
appState.fetch({
  success: function() {
    console.log("AppState fetched.");
  },
  // If no application state was retrieved then initialize one.
  error: function() {
    console.log("AppState not fetched, initializing.");
    appState.currentImage.set({
      id: "2008_000003",
      width: 500,
      height: 333,
      url: "../example-data/images/2008_000003.jpg",
      comment: ""
    }).save();
    // Setting the current image on the application state will trigger the
    // current image model to fetch from the server and update.
    appState.set("currentImage", "2008_000003");
    appState.save();
  }
});

appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator.Line"),
appState.pointSets.fetch({
  success: function() { console.log("points fetched"); },
  error: function() { console.log("error fetching points"); }
});

