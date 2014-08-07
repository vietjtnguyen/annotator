/*
 * The App model represents application information such as the current active
 * image, model states, zoom/pan parameters, etc. It is saved to local storage.
 */
var App = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.application"),
  defaults: {
    activeImage: "2008_000003",
    zoom: {
      translate: [0, 0],
      scale: 1
    }
  },
  initialize: function() {
  }
});

var Image = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.image"),
  defaults: {
    name: "",
    width: 0,
    height: 0,
    url: ""
  },
  initialize: function() {
  },
  validate: function(attrs, options) {
  }
});

var ImageCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.images"),
  model: Image,
  initialize: function() {
  },
});

var Point = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.point"),
  initialize: function() {
    /*
     * These getters and setters need to be defined for the D3 drag behavior to
     * modify correctly because these values are accessible from the model via
     * the `get` method but D3 expects to modify them directly as properties
     * (e.g. `d.x` and `d.y`, not `d.get("x")` and `d.get("y")`).
     * <https://github.com/mbostock/d3/wiki/Drag-Behavior#on>
     * <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty>
     */
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

var PointCollection = Backbone.Collection.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.points"),
  model: Point,
  toSvgCoord: function() {
    /* <http://underscorejs.org/#invoke> */
    return this.invoke("toSvgCoord").join(" ");
  }
});

var PolyLine = Backbone.Model.extend({
  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.polyline"),
  initialize: function() {
    this.set("points", new PointCollection());
  },
  parse: function(response) {
    var points = this.get("points");
    points.reset(response.points);
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
