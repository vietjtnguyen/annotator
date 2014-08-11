var PointSetListView = Backbone.View.extend({

  events: {
    "click #addLineButton": "addItem"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "add", self.addItemView);
    self.listenTo(self.collection, "reset", self.addAllItemViews);
  },

  addItem: function() {
    console.log("addItem");
    var self = this;
    var newPointSet = new self.collection.model()
    self.collection.add(newPointSet);
    self.collection.select(newPointSet);
  },

  addItemView: function(newModel) {
    console.log("addItemView");
    var self = this;
    var newView = new PointSetListItemView({model: newModel, collection: self.collection});
    self.$("#lineListing").append(newView.render().el);
  },

  addAllItemViews: function() {
    console.log("addAllItemViews");
    var self = this;
    self.collection.forEach(self.addItemView, self);
  }

});
