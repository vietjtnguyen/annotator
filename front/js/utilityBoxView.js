// This Backbone view represents the utility box in the top-left corner that
// controls a few useful application states.
var UtilityBoxView = Backbone.View.extend({

  events: {
    "click #resetViewButton": "resetView",
    "click #toggleBgButton": "toggleBg",
    "click #toggleGridButton": "toggleGrid",
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.model, "change:lineColor", self.renderLineColor);
    self.$("#changeLineColorButton").colorpicker()
      .on("changeColor", function(e) {
        self.model.set("lineColor", e.color.toHex());
      });
  },

  renderLineColor: function() {
    var self = this;
    self.$("#changeLineColorButton>span").css("color", self.model.get("lineColor"));
  },

  resetView: function() {
    var self = this;
    // Create a D3 transition, not associated with any selection, set its
    // duration to 400 millisecs, and create a custom tweening function.
    d3.transition().duration(400).tween("zoom", function() {
      // Create value interpolators that will be used by the actual tweening
      // function (available via closure) to interpolate the translation and
      // scale of the zoom behvaior.
      var windowSize = getWindowSize(),
          zoom = self.model.get("zoom"),
          ix = d3.interpolate(zoom.translate[0], windowSize[0]/2 - self.model.currentImage.get("width")/2),
          iy = d3.interpolate(zoom.translate[1], windowSize[1]/2 - self.model.currentImage.get("height")/2),
          is = d3.interpolate(zoom.scale, 1);
      // Return the actual tween function. The function we're current in is a
      // "tween function factory" per the documentation.
      // <https://github.com/mbostock/d3/wiki/Transitions#tween>
      return function(t) {
        // Set the model's zoom's translation and scale to the interpolated
        // values. The model's change event will trigger `renderZoom` to
        // actually make changes to the DOM.
        self.model.set("zoom", {
          translate: [ix(t), iy(t)],
          scale: is(t)
        });
      }
    }).each("end", function() {
      // Save the state of the model's zoom at the end of the transition.
      self.model.save();
    });
  },

  toggleBg: function() {
    var self = this;
    self.model.set("background", self.model.get("background") == "light" ? "dark" : "light");
    self.model.save();
  },

  toggleGrid: function() {
    var self = this;
    self.model.set("grid", self.model.get("grid") == "off" ? "on" : "off");
    self.model.save();
  },

});
