// This model represents a single point. The points aren't stored as separate
// entities but rather with the point sets. However, the use of a model for
// points is useful for giving each point a unique id.
var Point = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.point"),
  initialize: function() {
    // These getters and setters need to be defined for the D3 drag behavior to
    // modify correctly because these values are accessible from the model via
    // the `get` method but D3 expects to modify them directly as properties
    // (e.g. `d.x` and `d.y`, not `d.get("x")` and `d.get("y")`).
    // <https://github.com/mbostock/d3/wiki/Drag-Behavior#on>
    // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty>
    Object.defineProperty(this, "x",{
      get: function() { return this.get("x"); },
      set: function(value) { this.set("x", value); }
    });
    Object.defineProperty(this, "y",{
      get: function() { return this.get("y"); },
      set: function(value) { this.set("y", value); }
    });
  },
  defaults: {
    x: 0,
    y: 0
  },
  toSvgCoord: function() {
    return this.get("x").toString() + "," + this.get("y").toString();
  }
});

// This collection represents an ordered set of points.
var PointCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.points"),
  model: Point,
  toSvgCoord: function() {
    // <http://underscorejs.org/#invoke> 
    return this.invoke("toSvgCoord").join(" ");
  }
});

var OrderedPointSet = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.orderedpointset"),
  defaults: {
    points: new PointCollection()
  },
  models: {
    points: PointCollection  
  },
  initialize: function() {
  },
  parse: function(response, options) {
    var self = this;
    _.forEach(self.models, function(Model, attributeName) {
      response[attributeName] = new Model(response[attributeName], {parse: true});
    });
    return response;
  },
  save: function(attributes, options) {
    this.get("points").forEach(function(i) { i.save(); });
    Backbone.Model.prototype.save.call(this, attributes, options);
  },
  // toSvgCoord: function() {
  //   return _.map(this.get("points"), function(i) { return i.x + "," + i.y; }).join(" ");
  // }
  toSvgCoord: function() {
    return this.get("points").toSvgCoord();
  }
});

var Line = _.extend(OrderedPointSet, {
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.line"),
  canAddPoint: function() {
    return this.get("points").length < 2;
  },
  validate: function(attributes, options) {
    if (this.get("points").length == 2) {
      return "line requires exactly two points";
    }
  }
});

var PolyLine = _.extend(OrderedPointSet, {
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.polyline"),
  canAddPoint: function() {
    return true;
  }
});

var Polygon = _.extend(OrderedPointSet, {
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.polygon"),
  canAddPoint: function() {
    return true;
  },
  validate: function(attributes, options) {
    if (this.get("points").length < 3) {
      return "polygon requires at least three points";
    }
  }
});

var LineCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.lines"),
  model: Line
});

var PolyLineCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.polylines"),
  model: PolyLine
});

var PolygonCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.polygon"),
  model: Polygon
});

// This model represents an image along with its meta data (width, height,
// actual URL, etc.). The images are separate from the annotations because
// multiple annotations can exist for each image.
var Image = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.image"),
  defaults: {
    width: 0,
    height: 0,
    url: ""
  }
});

var ParallelLineAnnotation = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.parallellineannotation"),
  defaults: {
    image: null,
    lines: new LineCollection()
  },
  proxy: ["image", "lines"],
  models: {
    lines: LineCollection  
  },
  initialize: function() {
    _.forEach(self.models, function(Model, attributeName) {
      self.set(attributeName, new Model());
    });
  },
  toJSON: function(options) {
    var self = this;
    var jsonObject = _.clone(self.attributes);
    _.forEach(self.proxy, function(attributeName) {
      jsonObject[attributeName] = _.pick(jsonObject[attributeName], ["id"])
    });
    return jsonObject;
  },
  parse: function(response, options) {
    var self = this;
    _.forEach(self.models, function(Model, attributeName) {
      if (_.has(response, attributeName)) {
        self.get(attributeName).set(response[attributeName]);
        response[attributeName] = self.get(attributeName);
      }
    });
    return response;
  }
});

// The App model represents application information such as the current active
// image, model states, zoom/pan parameters, etc. It is saved to local storage.
var App = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.application"),
  defaults: {
    currentAnnotation: null,
    background: "light",
    grid: "off",
    zoom: {
      translate: [0, 0],
      scale: 1
    }
  },
  referencedAttributes: {
    currentAnnotation: ParallelLineAnnotation  
  },
  embeddedAttributes: {
  },
  initialize: function() {
  },
  recurseFetch: function(options) {
    self.fetch(_.extend(options, {
      success: function(model, response, options) {
        _.forEach(self.refAttributes, function(attributeName) {
          var fetch = self.get(refAttributes).recurseFetch || self.get(refAttributes).fetch;
          fetch(options);
        };
      }
    });
  },
  toJSON: function(options) {
    var self = this;
    var jsonObject = _.clone(self.attributes);
    _.forEach(self.refAttributes, function(attributeName) {
      jsonObject[attributeName] = _.pick(jsonObject[attributeName], ["id"])
    });
    return jsonObject;
  },
  parse: function(response, options) {
    var self = this;
    _.forEach(self.models, function(Model, attributeName) {
      if (_.has(response, attributeName)) {
        self.get(attributeName).set(response[attributeName]);
        response[attributeName] = self.get(attributeName);
      }
    });
    return response;
  }
});
