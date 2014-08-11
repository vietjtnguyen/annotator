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
