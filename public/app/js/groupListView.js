var GroupListView = Backbone.View.extend({

  events: {
    // If the add button is clicked then add a new group!
    "click #addGroupButton": "addItem"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If the point set collection adds a model then we'll want to add an
    // accompanying point set list item view.
    self.listenTo(self.appState.groups, "add", self.addItemView);
  },

  addItem: function() {
    var self = this;

    // Note that we have to add it to the collection before we call save so
    // that the model can adopt the URL of the collection.
    var newGroup = new Group({}, {appState: self.appState});
    self.appState.groups.add(newGroup);
    newGroup.save({
      success: function() {
        appState.set("selectedModelId", newGroup.get("id"));
      }
    });
  },

  addItemView: function(newGroup) {
    var self = this;
    var newView = new GroupListItemView({appState: self.appState, model: newGroup});
    self.$("#groupListing").append(newView.createDomElement());
  }

});
