var PointSetListView = Backbone.View.extend({

  events: {
    // If the add button is clicked then add a new point set!
    "click #addPointSetButton": "addItem"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    self.pointSetType = "Line";

    self.on("change:pointSetType", self.renderPointSetType);

    // If the point set collection adds a model then we'll want to add an
    // accompanying point set list item view.
    self.listenTo(self.appState.pointSets, "add", self.addItemView);
  },

  setPointSetType: function(pointSetType) {
    var self = this;
    self.pointSetType = pointSetType;
    self.trigger("change:pointSetType");
  },

  renderPointSetType: function() {
    var self = this;
    self.$("h3").text(self.pointSetType);
    self.$("#addText").text("Add " + self.pointSetType);
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
  }

});
