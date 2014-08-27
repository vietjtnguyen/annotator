// The point set collection is a simple Backbone Collection that holds many
// point sets. It represents the essential data structure for an annotation for
// a single image. For example, a point set represents a bounding box and an
// image's annotation is a collection of bounding boxes.
var PointSetCollection = Backbone.Collection.extend({

  model: Line,

  initialize: function(models, options) {
    var self = this;
    self.appState = options.appState || self.appState;
  },

});
