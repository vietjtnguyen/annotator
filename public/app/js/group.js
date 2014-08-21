// This model represents a group. The model itself doesn't actually need to
// store anything, it simply needs to be something unique that can be assigned
// to point sets. However, we make a model anyway because we want to store them
// in collections since the user can add and remove groups.
var Group = Backbone.Model.extend({
  
  idAttribute: "_id",

  initialize: function(attributes, options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If this model gets removed or destroyed we want to make sure it doesn't
    // stay as the application's selection.
    self.on("remove", self.removeSelection);
    self.on("destroy", self.removeSelection);
  },

  parse: function(response, options) {
    var self = this;
    self.appState = options.appState || self.appState;
    return response;
  },

  removeSelection: function() {
    var self = this;
    if (self.appState.get("selectedGroupId") == self.get(self.idAttribute)) {
      self.appState.set("selectedGroupId", "");
      self.appState.save();
    }
  }

});
