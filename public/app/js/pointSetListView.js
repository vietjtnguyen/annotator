var PointSetListView = Backbone.View.extend({

  events: {
    "click #togglePointSetsButton": "toggleList",
    // If the add button is clicked then add a new point set!
    "click #addPointSetButton": "addItem"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    self._pointSetType = "Line";

    // If the point set type changes then rerender the interface text
    // accordingly.
    self.on("change:pointSetType", self.renderPointSetType);

    // If the point set collection adds a model then we'll want to add an
    // accompanying point set list item view.
    self.listenTo(self.appState.pointSets, "add", self.addItemView);
  },

  // Emulates a Backbone Model's behavior by setting an internal attribute and
  // triggering an event (which the list item listens to in order to rerender
  // its own text).
  setPointSetType: function(pointSetType) {
    var self = this;
    self._pointSetType = pointSetType;
    self.trigger("change:pointSetType", self._pointSetType);
  },

  renderPointSetType: function() {
    var self = this;
    self.$("h3").text(self._pointSetType);
    self.$("#addText").text("Add " + self._pointSetType);
  },

  toggleList: function() {
    var self = this;
    self.$("#lineListing").toggle("blind");
  },

  addItem: function() {
    var self = this;

    // Note that we have to add it to the point set collection before we call
    // save so that the model can adopt the URL of the collection.
    var newPointSet = new self.appState.pointSets.model({}, {appState: self.appState});
    self.appState.pointSets.add(newPointSet);
    newPointSet.save({}, {
      success: function() {
        self.appState.set("selectedPointSetId", newPointSet.get(newPointSet.idAttribute));
      }
    });
  },

  addItemView: function(newPointSet) {
    var self = this;
    var newView = new PointSetListItemView({appState: self.appState, model: newPointSet});
    self.$("#lineListing").append(newView.createDomElement());
  }

});
