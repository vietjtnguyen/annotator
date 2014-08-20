var GroupCollection = Backbone.Collection.extend({

  model: Group,

  initialize: function(models, options) {
    var self = this;
    self.appState = options.appState || self.appState;
  },

});
