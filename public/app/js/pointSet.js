// The point set is a simple Backbone Model that contains just a few
// attributes: description, parent, and an array of point objects. The point
// set generalizes many different discrete annotation types including lines,
// polylines, polygons, and bounding boxes. Since it acts as a base class it
// should be considered abstract and not instantiated.
var PointSet = Backbone.Model.extend({

  idAttribute: "_id",

  // Make sure that the point set starts off with an empty array of points.
  defaults: {
    description: "",
    group: "",
    points: []
  },

  initialize: function(attributes, options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If this model gets removed or destroyed we want to make sure it doesn't
    // stay as the application's selection.
    self.on("remove", self.removeSelection);
    self.on("destroy", self.removeSelection);
  },

  parse: function(response, options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // Turn the vanilla point hashes into actual Point objects.
    response.points = _.map(response.points, function(i) { return new Point(i); });

    return response;
  },

  removeSelection: function() {
    var self = this;
    if (self.appState.get("selectedPointSetId") == self.get(self.idAttribute)) {
      self.appState.set("selectedPointSetId", "");
      self.appState.save();
    }
  },

  // Converts the points stored by the model into a string of coordinates
  // suitable for an SVG `points` attribute (such as on `polyline` and
  // `polygon`).
  toSvgCoords: function() {
    // <http://underscorejs.org/#invoke> 
    return _.invoke(this.get("points"), "toSvgCoord").join(" ");
  },

  isFull: function() {
    console.log("wrong");
    return false;
  },

  selectSelf: function(force) {
    var self = this;
    if (self.appState.isInGroupMembershipMode()) {
      var selectedGroupId = self.appState.get("selectedGroupId");
      if (!force && self.get("group") == selectedGroupId) {
        self.set("group", "");
      } else {
        self.set("group", selectedGroupId);
      }
      self.save();
    } else {
      self.appState.set("selectedPointSetId", !force && self.appState.get("selectedPointSetId") === self.get(self.idAttribute) ? "" : self.get(self.idAttribute));
      self.appState.save();
    }
  }

});

// A single point is a point set which can only contain at most one point. This
// is enforced with the `validate` function and communicated to the application
// via `isFull`.
var SinglePoint = PointSet.extend({

  validate: function() {
    var self = this;
    if (self.get("points").length > 1) {
      return "point has " + self.get("points").length + " points, can only have at most one.";
    }
  },

  isFull: function() {
    console.log("right");
    var self = this;
    return self.get("points").length >= 1;
  },

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("use")
      .attr("xlink:href", "#plusPath");
  },

  updateSvgElement: function(d3Selection) {
    var self = this;
    return d3Selection
      .attr("transform", "translate(" + self.toSvgCoords() + ")");
  }

});

var PointsBasedPointSet = PointSet.extend({

  updateSvgElement: function(d3Selection) {
    var self = this;
    return d3Selection
      .attr("points", self.toSvgCoords());
  }

});

// A line is a point set which can only contain at most two points. This is
// enforced with the `validate` function and communicated to the application
// via `isFull`.
var Line = PointsBasedPointSet .extend({
  
  svgElement: "polyline",

  validate: function() {
    var self = this;
    if (self.get("points").length > 2) {
      return "line has " + self.get("points").length + " points, can only have at most two.";
    }
  },

  isFull: function() {
    var self = this;
    return self.get("points").length >= 2;
  },

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polyline");
  }

});

// A poly line is a point set represented by a poly line drawn through the
// points in order and not closing the path via a connection from the last
// point to the first point.
var PolyLine = PointsBasedPointSet .extend({

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polyline");
  }

});

// A polygon is a point set represented by a poly line drawn through the points
// in order and closing the path via a connection from the last point to the
// first point.
var Polygon = PointsBasedPointSet .extend({

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polygon");
  }

});
