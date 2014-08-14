// The point set is a simple Backbone Model that contains one attribute: an
// array of point objects. The point set generalizes many different discrete
// annotation types including lines, polylines, polygons, and bounding boxes.
var PointSet = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.PointSet"),

  // Make sure that the point set starts off with an empty array of points.
  defaults: {
    points: [],
    group: null
  },

  initialize: function(attributes, options) {
    var self = this;
    self.appState = options.appState || self.appState;
  },

  parse: function(response, options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // Turn the vanilla point hashes into actual Point objects.
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
      self.appState.set("selectedPointSetId", !force && self.appState.get("selectedPointSetId") === self.get("id") ? "" : self.get("id"));
      self.appState.save();
    }
  }

});

var SinglePoint = PointSet.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.SinglePoint"),

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

var Line = PointsBasedPointSet .extend({
  
  svgElement: "polyline",

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
  },

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polyline");
  }

});

var PolyLine = PointsBasedPointSet .extend({
  
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.PolyLine"),

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polyline");
  }

});

var Polygon = PointsBasedPointSet .extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Polygon"),

  appendSvgElement: function(d3Selection) {
    return d3Selection.append("polygon");
  }

});
