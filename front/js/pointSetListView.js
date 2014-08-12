var PointSetListView = Backbone.View.extend({

  events: {
    "click #addPointSetButton": "addItem"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "add", self.addItemView);
    self.listenTo(self.collection, "reset", self.addAllItemViews);
  },

  addItem: function() {
    var self = this;
    var newModel = new self.collection.model();
    self.collection.add(newModel);
    self.collection.select(newModel);
  },

  addItemView: function(newModel) {
    var self = this;
    var newView = new PointSetListItemView({model: newModel, collection: self.collection});
    self.$("#lineListing").append(newView.render().el);
  },

  addAllItemViews: function() {
    var self = this;
    self.collection.forEach(self.addItemView, self);
  }

});
