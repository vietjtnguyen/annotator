var PointSetListItemView = Backbone.View.extend({

  template: _.template($("#listItemTemplate").html()),

  tagName: "a",

  events: {
    "click": "selectSelf",
    "click .glyphicon-remove": "removeClick",
    "mouseover": "broadcastMouseOver",
    "mouseout": "broadcastMouseOut"
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    // If the model gets or changes its ID then update the ID of the DOM
    // element.
    self.listenTo(self.model, "change:id", self.renderId);

    // If the point set's points change then rerender the item text to update
    // the number of bullet points.
    self.listenTo(self.model, "change:points", self.render);

    // If the model changes its group membership then rerender the selection
    // visual in case we are in group membership mode.
    self.listenTo(self.model, "change:group", self.renderSelection);

    // If the model gets removed from the collection (perhaps due to a resync)
    // then start a pretty removal that leads to the removal of the view
    // (instead of destruction of the model which leads to the removal of the
    // view).
    self.listenTo(self.model, "remove", self.startPrettyRemove);
    
    // If the model gets destroyed then remove the list item (self.remove is a
    // Backbone method) immediately.
    self.listenTo(self.model, "destroy", self.remove);

    // If the selected point set changes then rerender the selection visual.
    self.listenTo(self.appState, "change:selectedPointSetId", self.renderSelection);

    // If the selected group changes then rerender the selection visual because
    // we might have changed to in/out of group membership mode.
    self.listenTo(self.appState, "change:selectedGroupId", self.renderSelection);

    // If the point set collection changes via removal then we'll need to
    // update the visual index in the list. This index has no functional
    // purpose. We don't respond to add events because adds are always appended
    // to the end and don't affect existing indices.
    self.listenTo(self.appState.pointSets, "remove", self.renderText);

    // TODO
    self.listenTo(self.appState.pointSets, "change:pointSetType", self.renderText);
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
    self.$el.attr("id", self.model.get("id"));
  },

  renderText: function() {
    var self = this;
    var index = self.appState.pointSets.indexOf(self.model);
    var bullets = _.map(_.range(self.model.get("points").length), function() { return "&bull;"; }).join("");
    self.$("#text").html("Item " + index + " " + bullets);
  },

  renderSelection: function(selectedModel) {
    var self = this;
    if ( (self.appState.isInGroupMembershipMode() && self.model.get("group") === self.appState.get("selectedGroupId")) ||
         (!self.appState.isInGroupMembershipMode() && self.model.get(self.model.idAttribute) === self.appState.get("selectedPointSetId")) ) {
      self.$el.addClass("active");
    } else {
      self.$el.removeClass("active");
    }
  },

  selectSelf: function(jQueryEvent) {
    var self = this;
    self.model.selectSelf();
  },

  removeClick: function(jqueryEvent) {
    var self = this;
    jqueryEvent.stopPropagation();
    self.startPrettyDestroy();
  },

  startPrettyDestroy: function() {
    var self = this;
    self._prettyRemove(true);
  },

  startPrettyRemove: function() {
    var self = this;
    self._prettyRemove(false);
  },

  _prettyRemove: function(destroy) {
    var self = this;

    // Trigger this event to notify others views (in particular the actual
    // visualization) that removal has started so that they can start any
    // removal transitions they have.
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
            if (destroy) {

              // Model destruction also removes the model from the collection
              // (`PointSetCollection`) that it is a part of if the `destroy`
              // flag is on (which it will be if called by clicking the remove
              // button on the item). Actual view removal will occur in
              // response to the model's `destroy` event.
              self.model.destroy();

            } else {

              // If we're not destroying the model then we won't get a
              // `destroy` event which signals us to remove the view so just
              // remove it here.
              self.remove();

            }
          });
      });
  },

  broadcastMouseOver: function() {
    var self = this;
    self.model.trigger("mouseOver");
  },

  broadcastMouseOut: function() {
    var self = this;
    self.model.trigger("mouseOut");
  }

});
