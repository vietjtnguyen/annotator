var GroupCollection = Backbone.Collection.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Group"),

  model: Group,

  initialize: function() {
    var self = this;
    self.selected = null;
    self.on("add", self.saveNewModel);
  },

  saveNewModel: function(model, collection, options) {
    model.save();
  },

  hasSelected: function(model) {
    var self = this;
    return model !== null;
  },

  isSelected: function(model) {
    var self = this;
    return model == this.selected;
  },

  select: function(model) {
    var self = this;
    var lastSelectedPointSet = self.selected;
    self.selected = model || null;
    if (self.selected != lastSelectedPointSet) {
      if (lastSelectedPointSet) {
        lastSelectedPointSet.trigger("unselect");
      }
      if (self.selected) {
        self.selected.trigger("select");
      }
    }
    self.trigger("select", self.selected);
  },

  unselect: function() {
    var self = this;
    if (self.selected) {
      self.selected.trigger("unselect");
    }
    self.selected = null;
    self.trigger("select", self.selected);
  },

  getSelected: function() {
    var self = this;
    return self.selected;
  }

});
