var PointSetListView = Backbone.View.extend({

  events: {
    // If the add button is clicked then add a new point set!
    "click #addPointSetButton": "addItem"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If the point set collection adds a model then we'll want to add an
    // accompanying point set list item view.
    self.listenTo(self.appState.pointSets, "add", self.addItemView);

    self.listenTo(self.appState.pointSets, "reset", self.addAllItemViews);
  },

  addItem: function() {
    var self = this;

    var newPointSet = new self.appState.pointSets.model({}, {appState: self.appState});
    newPointSet.save({}, {
      success: function() {
        appState.set("selectedPointSetId", newPointSet.get("id"));
      }
    });

    self.appState.pointSets.add(newPointSet);
  },

  addItemView: function(newPointSet) {
    var self = this;
    var newView = new PointSetListItemView({appState: self.appState, model: newPointSet});
    self.$("#lineListing").append(newView.createDomElement());
  },

  addAllItemViews: function() {
    console.log("It actually got called.");
    var self = this;
    self.appState.pointSets.forEach(self.addItemView, self);
  }

});
