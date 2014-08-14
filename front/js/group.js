// This model represents a group. The model itself doesn't actually need to
// store anything, it simply needs to be something unique that can be assigned
// to point sets. However, we make a model anyway because we want to store them
// in collections since the user can add and remove groups.
var Group = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Group"),

  initialize: function(attributes, options) {
    var self = this;
    self.appState = options.appState || self.appState;
  },

  parse: function(response, options) {
    var self = this;
    self.appState = options.appState || self.appState;
    return response;
  }

});
