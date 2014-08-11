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
