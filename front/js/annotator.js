// This model represents the application state and doubly serves as the root
// namespace for the application in the sense that point sets, views, and more
// are attached to this model, but not as attributes.
var AppState = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.AppState"),

  defaults: {
    id: 0,
    currentImage: null,
    currentAnnotation: null,
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
    self.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator.PolyLine");

    // Establish the collection of groups. Like the collection of point sets,
    // this does not change across changes.
    self.groups = new GroupCollection([], {appState: self});

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
    self.listenTo(self, "change:currentImage", self.refreshCurrentImage);

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
      .set("id", self.get("currentImage"))
      .fetch({
        success: function() {
          console.log("currentImage fetched");
          console.log(self.currentImage);
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
          self.set("selectedPointSetId", model.get("id"));
        }
      });

    }
  }

});

////////////////////////////////////////////////////////////////////////////////

var appState = new AppState();

var AppRouter = Backbone.Router.extend({

  routes: {
    "": "line",
    "singlepoint": "singlepoint",
    "line": "line",
    "polyline": "polyline",
    "polygon": "polygon"
  },

  singlepoint: function() {
    var self = this;
    self.initializeApp(SinglePoint, "SinglePoint");
  },

  line: function() {
    var self = this;
    self.initializeApp(Line, "Line");
  },

  polyline: function() {
    var self = this;
    self.initializeApp(PolyLine, "PolyLine");
  },

  polygon: function() {
    var self = this;
    self.initializeApp(Polygon, "Polygon");
  },

  initializeApp: function(model, name) {
    var self = this;
    self.initializePointSetType(model, name);
    appState.setListingView.setPointSetType(name);
    self.fetchAnnotation();
  },

  initializePointSetType: function(model, name) {
    appState.pointSets.model = model;
    appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator." + name);
  },

  fetchAnnotation: function() {

    // Grab the application state if it was saved locally.
    appState.fetch({
      appState: appState,
      success: function() {
        console.log("AppState fetched.");
      },

      // If no application state was retrieved then initialize one.
      error: function() {
        console.log("AppState not fetched, initializing.");

        appState.currentImage.set({
          id: "2008_000003",
          width: 500,
          height: 333,
          url: "../example-data/images/2008_000003.jpg",
          comment: ""
        }).save();

        // Setting the current image on the application state will trigger the
        // current image model to fetch from the server and update.
        appState.set("currentImage", "2008_000003");
        appState.save();
      }
    });

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

  }

});

new AppRouter();

Backbone.history.start({
  pushState: false,
});
