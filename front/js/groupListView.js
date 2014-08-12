var GroupListView = Backbone.View.extend({

  events: {
    "click #addGroupButton": "addItem"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "add", self.addItemView);
    self.listenTo(self.collection, "reset", self.addAllItemViews);
  },

  addItem: function() {
    var self = this;
    var newGroup = new Group();
    self.collection.add(newGroup);
    self.collection.select(newGroup);
  },

  addItemView: function(newGroup) {
    var self = this;
    var newView = new GroupListItemView({model: newGroup, collection: self.collection});
    self.$("#groupListing").append(newView.render().el);
  },

  addAllItemViews: function() {
    var self = this;
    self.collection.forEach(self.addItemView, self);
  }

});
