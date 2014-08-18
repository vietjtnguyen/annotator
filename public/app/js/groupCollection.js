var GroupCollection = Backbone.Collection.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Group"),

  model: Group,

  initialize: function(models, options) {
    var self = this;
    self.appState = options.appState || self.appState;
  },

});
