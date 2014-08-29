var ImageSetControlView = Backbone.View.extend({

  events: {
    "submit #imageSetForm": "goToSpecificImage",
    "click #goImageButton": "goToSpecificImage",
    "click #prevImageButton": "goToPreviousImage",
    "click #nextImageButton": "goToNextImage",
  },

  initialize: function(options) {
    var self = this;
    self.appState = options.appState || self.appState;

    self.render();
  },

  render: function() {
    var self = this;
    self.$("#imageSetIndex").val(self.appState.currentImageSetIndex);
  },

  goToSpecificImage: function() {
    var self = this;
    var index = parseInt(self.$("#imageSetIndex").val());
    if (index && index >= 1 && index <= self.appState.currentImageSet.get("imageIds").length) {
      self.jumpImage(index);
    } else {
      self.appState.pageAlert("warning", "Index is invalid.");
    }
    return false;
  },

  goToPreviousImage: function() {
    var self = this;
    self.offsetImage(-1);
    return false;
  },

  goToNextImage: function() {
    var self = this;
    self.offsetImage(1);
    return false;
  },

  offsetImage: function(offset) {
    var self = this;
    self.appState.currentImageSetIndex = (self.appState.currentImageSetIndex - 1 + offset + self.appState.currentImageSet.get("imageIds").length) % self.appState.currentImageSet.get("imageIds").length + 1;
    appRouter.navigate("parallel-lines/set/" + self.appState.currentImageSet.get("name") + "/" + self.appState.currentImageSetIndex + "/", {trigger: true});
  },

  jumpImage: function(index) {
    var self = this;
    self.appState.currentImageSetIndex = (index - 1) % self.appState.currentImageSet.get("imageIds").length + 1;
    appRouter.navigate("parallel-lines/set/" + self.appState.currentImageSet.get("name") + "/" + self.appState.currentImageSetIndex + "/", {trigger: true});
  }

});
