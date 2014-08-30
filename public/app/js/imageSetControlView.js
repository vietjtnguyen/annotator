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

    var index = self.appState.currentImageSetIndex;
    var setLength = self.appState.currentImageSet.get("imageIds").length;
    index = (index - 1 + offset + setLength) % setLength + 1;
    self.appState.currentImageSetIndex = index;

    var setIndexUrl = urljoin("parallel-lines/set/", self.appState.currentImageSet.get("name"), self.appState.currentImageSetIndex);
    appRouter.navigate(setIndexUrl, {trigger: true});
  },

  jumpImage: function(index) {
    var self = this;

    var setLength = self.appState.currentImageSet.get("imageIds").length;
    self.appState.currentImageSetIndex = (index - 1) % setLength + 1;

    var setIndexUrl = urljoin("parallel-lines/set/", self.appState.currentImageSet.get("name"), self.appState.currentImageSetIndex);
    appRouter.navigate(setIndexUrl, {trigger: true});
  }

});
