// Establish API URL.
var rootUrl = "";
var baseApiUrl = window.location.protocol + "//" + window.location.host + rootUrl;

////////////////////////////////////////////////////////////////////////////////

// This model represents the application state and doubly serves as the root
// namespace for the application in the sense that point sets, views, and more
// are attached to this model, but not as attributes.
var AppState = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("annotator-appstate"),

  defaults: {
    selectedPointSetId: "",
    selectedGroupId: "",
    background: "light",
    grid: "off",
    lineColor: "#000",
    zoom: {
      translate: [0, 0],
      scale: 1
    }
  },

  initialize: function() {
    var self = this;

    // Populate the current image. This model doesn't get deleted or destroyed.
    // If the image changes then the ID is changed and a fetch performed.
    self.currentImage = new Image();

    // Establish the collection of point sets. This collection itself does not
    // get deleted or destroyed. When point set type or annotation changes the
    // type is changed on this collection and data is refetched back into this
    // same collection.
    // TODO: Is this idiomatic or should it just create a new collection
    // everytime changes are made?
    self.pointSets = new PointSetCollection([], {model: PolyLine, appState: self});

    // Establish the collection of groups. Like the collection of point sets,
    // this does not change across changes.
    self.groups = new GroupCollection([], {appState: self});

    // TODO: If the group collection changes or resets then we want to reset
    // the group selection if the current group selection is not available.

    // The utility box is used for various application wide settings.
    self.utilityBoxView = new UtilityBoxView({appState: self, el: $("#utilityBox")[0]});

    // The working area view owns the point set visualizations. It is
    // responsible for acting as a parent for those visualizations along with
    // creating and adding them on point set collection add events.
    self.workingAreaView = new WorkingAreaView({appState: self, el: $("body")[0]});

    // The set listing view is the list of point sets in the right tool pane.
    // This view acts as a parent to the individual point set item views and is
    // responsible for creating and adding those item views. Those item views
    // can control the selection and destruction of point sets.
    self.setListingView = new PointSetListView({appState: self, el: $("#pointSetSection")[0]});

    // The group listing view is similar to the set listing view in
    // responsibilities except for groups instead of point sets.
    self.groupListingView = new GroupListView({appState: self, el: $("#groupSection")[0]});

    // We want to the current image *model* to listen to changes in the
    // `currentImage` attribute on the application state so that the current
    // image model can update via a fetch accordingly.
    self.listenTo(self, "imageChanged", self.refreshCurrentImage);

    // Have the point set listen to the working area view for any "canvas clicks"
    // to know when to add points to the selected point set.
    self.listenTo(self.workingAreaView, "workingAreaClick", self.addNewPoint);
  },

  isInGroupMembershipMode: function() {
    var self = this;
    return self.get("selectedGroupId") !== "";
  },

  refreshCurrentImage: function() {
    var self = this;
    self.currentImage
      .fetch({
        success: function() {
          self.pointSets.url = baseApiUrl + "/api/parallel-lines/" + self.currentImage.get("_id") + "/point-set/";
          self.groups.url = baseApiUrl + "/api/parallel-lines/" + self.currentImage.get("_id") + "/group/";
          console.log("currentImage fetched");
          console.log(self.currentImage);
          console.log(self.pointSets.url);
          console.log(self.groups.url);

          appState.pointSets.fetch({
            appState: appState,
            remove: true,
            success: function() { console.log("points fetched"); },
            error: function() { console.log("error fetching points"); }
          });

          appState.groups.fetch({
            appState: appState,
            remove: true,
            success: function() { console.log("groups fetched"); },
            error: function() { console.log("error fetching groups"); }
          });
        },
        error: function() {
          appState.pageAlert("danger", "Error while fetching image. Image \"" + self.currentImage.get("name") + "\" likely does not exist.");
          self.stopListening();
          // TODO: Disable interface elements.
        }
      });
  },

  addNewPoint: function(mousePosition) {
    var self = this;

    // If there is a point set selected then we'll treat that as the "active"
    // point set that we'll work with.
    var activePointSet = self.pointSets.get(self.get("selectedPointSetId"));

    // If there isn't a valid active point set then we'll create a new one,
    // initialize it with the selected group ID, and add it to our
    // collection.
    if (!activePointSet || activePointSet.isFull()) {
      activePointSet = new self.pointSets.model({group: self.get("selectedGroupId")}, {appState: self});
      self.pointSets.add(activePointSet);
    }

    // At this point we should have an active point set.
    if (activePointSet) {

      // We'll create a new `Point` object from the mouse click and assign it
      // a unique GUID (so that we can key with it for D3 data selections).
      var point = new Point({
        id: guid(),
        x: mousePosition[0],
        y: mousePosition[1]
      });

      // Then we'll append it to the active point set's existing list of
      // points.
      var points = activePointSet.get("points");
      activePointSet.set("points", _.union(points, [point]));

      // Finally we'll save every action and select the active point set so
      // that we can easily chain point adding operations.
      activePointSet.save({}, {
        success: function(model, response, options) {
          self.set("selectedPointSetId", model.get(model.idAttribute));
        }
      });

    }
  },

  pageAlertTemplate: _.template($("#alertTemplate").html()),
  pageAlert: function(alertType, message) {
    var self = this;
    $("#alertSection").append(
      $(self.pageAlertTemplate({alertType: alertType, message: message}))[0]
    );
  }

});

////////////////////////////////////////////////////////////////////////////////

var appState = new AppState();

var AppRouter = Backbone.Router.extend({

  routes: {
    "parallel-lines/:imageName/": "parallelLinesDirect",
    "parallel-lines/set/:setName/:index/": "parallelLinesSet"
  },

  parallelLinesDirect: function(imageName) {
    var self = this;
    self.initializePointSetType(Line, "Line");
    appState.setListingView.setPointSetType(name);
    self.fetchAnnotation(imageName);
  },

  initializePointSetType: function(model, name) {
    appState.pointSets.model = model;
    // appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator." + name);
  },

  fetchAnnotation: function(imageName) {

    appState.set("id", "parallel-lines-"+imageName);
    appState.currentImage.set("name", imageName);
    appState.currentImage.urlRoot = baseApiUrl + "/api/image/name/";
    appState.trigger("imageChanged");

    // Grab the application state if it was saved locally.
    appState.fetch({
      appState: appState,
      success: function() {
        console.log("AppState fetched.");
      },

      // If no application state was retrieved then initialize one.
      error: function() {
        console.log("AppState not fetched, initializing.");
      }
    });

  }

});

var appRouter = new AppRouter();

var urlSuccessfullyMatched = Backbone.history.start({
  root: rootUrl,
  pushState: true
});
if (!urlSuccessfullyMatched) {
  console.log("Could not find matching URL in router.");
  appState.pageAlert("danger", "Could not interpret the current URL.");
}
