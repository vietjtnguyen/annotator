var GroupListItemView = Backbone.View.extend({

  template: _.template($("#listItemTemplate").html()),

  tagName: "a",

  events: {
    "click": "selectSelf",
    "click .glyphicon-remove": "removeClick"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If the model gets or changes its ID then update the ID of the DOM
    // element.
    self.listenTo(self.model, "change:id", self.renderId);

    self.listenTo(self.model, "remove", self.startPrettyRemoval);

    // If the model gets destroyed then remove the list item (self.remove is a
    // Backbone method).
    self.listenTo(self.model, "destroy", self.remove);

    // If the selected group changes then rerender the selection visual.
    self.listenTo(self.appState, "change:selectedGroupId", self.renderSelection);

    // If the point set collection changes via removal then we'll need to
    // update the visual index in the list. This index has no functional
    // purpose. We don't respond to add events because adds are always appended
    // to the end and don't affect existing indices.
    self.listenTo(self.appState.groups, "remove", self.renderText);
  },

  // Create the element from an underscore template and then set the Backbone
  // view's element to it.
  createDomElement: function() {
    var self = this;
    self.setElement($(self.template(self.model.attributes))[0]);
    self.render();
    return self.el;
  },

  render: function() {
    var self = this;
    self.renderId();
    self.renderText();
    self.renderSelection();
    return self;
  },

  renderId: function() {
    var self = this;
    self.$el.attr("id", self.model.get(self.model.idAttribute));
  },

  renderText: function() {
    var self = this;
    var index = self.appState.groups.indexOf(self.model);
    self.$("#text").html("Group " + index);
  },

  renderSelection: function() {
    var self = this;
    if (self.model.get(self.model.idAttribute) === self.appState.get("selectedGroupId")) {
      self.$el.addClass("active");
    } else {
      self.$el.removeClass("active");
    }
  },

  selectSelf: function() {
    var self = this;
    self.appState.set("selectedGroupId", self.appState.get("selectedGroupId") === self.model.get(self.model.idAttribute) ? "" : self.model.get(self.model.idAttribute));
    self.appState.save();
  },

  removeClick: function(jqueryEvent) {
    var self = this;
    jqueryEvent.stopPropagation();
    self.startPrettyRemoval();
  },

  startPrettyRemoval: function() {
    var self = this;
    // Trigger this event to notify others that removal has started.
    self.model.trigger("startingRemoval");
    // This gets us a nice and smooth removal animation in two steps. First is
    // fades out the element, then it moves the element up using `margin-top`
    // in order to slide all subsequent elements into their new positions.
    d3.select(self.el).transition()
      .duration(250)
      .style("opacity", 0)
      .each("end", function() {
        var selection = d3.select(self.el);
        var origHeight = selection.node().getBoundingClientRect().height;
        selection.transition()
          .duration(250)
          .style("margin-top", -origHeight+"px")
          .each("end", function() {
            // Model destruction also removes the model from the collection
            // (GroupCollection) that it is a part of.
            self.model.destroy();
          });
      });
  }

});
