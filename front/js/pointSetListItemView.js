var PointSetListItemView = Backbone.View.extend({

  template: _.template($("#pointSetItemTemplate").html()),

  tagName: "a",

  events: {
    "click": "selectItem",
    "click .glyphicon-remove": "removeItem",
    "mouseover": "forceMouseOver",
    "mouseout": "forceMouseOut"
  },

  initialize: function() {
    var self = this;
    self.listenTo(self.collection, "remove", self.renderIndex);
    self.listenTo(self.collection, "select", self.renderSelection);
    self.listenTo(appState.groups, "select", self.renderSelection);
    self.listenTo(self.model, "change:points", self.renderIndex);
    self.listenTo(self.model, "destroy", self.remove);
  },

  render: function() {
    var self = this;
    self.setElement($(self.template({index: self.collection.indexOf(self.model)}))[0]);
    self.renderIndex();
    self.renderSelection();
    return self;
  },

  renderIndex: function() {
    var self = this;
    self.$("#text").html("Line " + self.collection.indexOf(self.model) + " " + _.map(_.range(self.model.get("points").length), function() { return "&bull;"; }).join(""));
    return self;
  },

  renderSelection: function(selectedModel) {
    var self = this;
    var selectedGroup = appState.groups.getSelected();
    if (selectedGroup) {
      if (self.model.get("group") == selectedGroup.get("id")) {
        self.$el.addClass("active");
      } else {
        self.$el.removeClass("active");
      }
    } else {
      if (self.model == selectedModel) {
        self.$el.addClass("active");
      } else {
        self.$el.removeClass("active");
      }
    }
  },

  selectItem: function() {
    var self = this;
    var selectedGroup = appState.groups.getSelected();
    if (selectedGroup) {
      if (self.model.get("group") == selectedGroup.get("id")) {
        self.model.set("group", "");
      } else {
        self.model.set("group", selectedGroup.get("id"));
      }
      self.model.save();
      self.renderSelection();
    } else {
      if (self.collection.isSelected(self.model)) {
        self.collection.unselect();
      } else {
        self.collection.select(self.model);
      }
    }
  },

  removeItem: function() {
    var self = this;
    // Trigger this event to notify others that removal has started.
    self.model.trigger("removing");
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
            // (PointSetCollection) that it is a part of.
            self.model.destroy();
          });
      });
  },

  forceMouseOver: function() {
    var self = this;
    self.model.trigger("listItemMouseOver");
  },

  forceMouseOut: function() {
    var self = this;
    self.model.trigger("listItemMouseOut");
  }

});
