// This Backbone view represents the utility box in the top-left corner that
// controls a few useful application states.
var UtilityBoxView = Backbone.View.extend({

  events: {
    // If the reset view button is clicked then reset the application's view
    // directly and let other event handlers update the view.
    "click #resetViewButton": "resetView",

    // If the toggle background button is clicked then toggle the application's
    // background directly and let other event handlers update the view.
    "click #toggleBgButton": "toggleBg",

    // If the toggle grid button is clicked then toggle the application's grid
    // directly and let other event handlers update the view.
    "click #toggleGridButton": "toggleGrid",
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    self.initialRender();
    self.render();

    // If the line color changes then update the line color changing button
    // accordingly.
    self.listenTo(self.appState, "change:lineColor", self.renderLineColor);

  },

  initialRender: function() {
    var self = this;
    self.$("#changeLineColorButton").colorpicker()
      .on("changeColor", function(e) {
        self.appState.userState.set("lineColor", e.color.toHex());
        self.appState.userState.save();
      });
  },

  render: function() {
    var self = this;
    self.renderLineColor();
    return self;
  },

  renderLineColor: function() {
    var self = this;
    self.$("#changeLineColorButton>span").css("color", self.appState.userState.get("lineColor"));
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
          zoom = self.appState.get("zoom"),
          ix = d3.interpolate(zoom.translate[0], windowSize[0]/2 - self.appState.currentImage.get("width")/2),
          iy = d3.interpolate(zoom.translate[1], windowSize[1]/2 - self.appState.currentImage.get("height")/2),
          is = d3.interpolate(zoom.scale, 1);
      // Return the actual tween function. The function we're current in is a
      // "tween function factory" per the documentation.
      // <https://github.com/mbostock/d3/wiki/Transitions#tween>
      return function(t) {
        // Set the appState's zoom's translation and scale to the interpolated
        // values. The appState's change event will trigger `renderZoom` to
        // actually make changes to the DOM.
        self.appState.set("zoom", {
          translate: [ix(t), iy(t)],
          scale: is(t)
        });
      };
    }).each("end", function() {
      // TODO: Do something at the end of a reset view?
    });
  },

  toggleBg: function() {
    var self = this;
    self.appState.userState.set("background", self.appState.userState.get("background") == "light" ? "dark" : "light");
    self.appState.userState.save();
  },

  toggleGrid: function() {
    var self = this;
    self.appState.userState.set("grid", self.appState.userState.get("grid") == "off" ? "on" : "off");
    self.appState.userState.save();
  },

});
