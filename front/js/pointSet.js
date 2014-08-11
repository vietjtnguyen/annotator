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
