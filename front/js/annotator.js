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
    self.finishedInitializing = false;
  },

  isInGroupMembershipMode: function() {
    var self = this;
    return self.get("selectedGroupId") !== "";
  },

});

////////////////////////////////////////////////////////////////////////////////
// Establish the application state and other models/views

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
    // TODO: Might as well move these into the AppState initializer.
    if (!appState.finishedInitializing) {
      self.phaseA();
    }
    self.phaseB(model, name);
    if (!appState.finishedInitializing) {
      self.phaseC();
      self.phaseD();
      self.phaseE();
    }
    self.phaseF();
    appState.finishedInitializing = true;
  },

  phaseA: function() {
    appState.currentImage = new Image();
  },

  phaseB: function(model, name) {
    if (!appState.finishedInitializing) {
      appState.pointSets = new PointSetCollection([], {model: model, appState: appState});
      appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator." + name);
    } else {
      appState.pointSets.model = model;
      appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator." + name);
    }
  },

  phaseC: function() {
    appState.groups = new GroupCollection([], {appState: appState});
  },

  // Create views
  phaseD: function() {
    appState.workingAreaView = new WorkingAreaView({appState: appState, el: $("body")[0]});
    appState.utilityBoxView = new UtilityBoxView({appState: appState, el: $("#utilityBox")[0]});
    appState.setListingView = new PointSetListView({appState: appState, el: $("#pointSetSection")[0]});
    appState.groupListingView = new GroupListView({appState: appState, el: $("#groupSection")[0]});
  },

  // Establish cross event hooks after all instances have been created
  phaseE: function() {

    // We want to the current image *model* to listen to changes in the
    // `currentImage` attribute on the application state so that the current image
    // model can update via a fetch accordingly.
    appState.currentImage.listenTo(appState, "change:currentImage", function() {
      console.log("what");
      appState.currentImage
        .set("id", appState.get("currentImage"))
        .fetch({
          success: function() {
            console.log("currentImage fetched");
            console.log(appState.currentImage);
          }
        });
    });

    // Have the point set listen to the working area view for any "canvas clicks"
    // to know when to add points to the selected point set.
    appState.pointSets.listenTo(appState.workingAreaView, "workingAreaClick", function(mousePosition) {
      console.log("pointSet workingAreaClick");
      console.log(mousePosition);
      var activePointSet = appState.pointSets.get(appState.get("selectedPointSetId"));
      if (!activePointSet || activePointSet.isFull()) {
        activePointSet = new appState.pointSets.model({group: appState.get("selectedGroupId")}, {appState: appState});
        appState.pointSets.add(activePointSet);
      }
      if (activePointSet) {
        var point = new Point({
          id: guid(),
          x: mousePosition[0],
          y: mousePosition[1]
        });
        var points = activePointSet.get("points");
        activePointSet.set("points", _.union(points, [point]));
        activePointSet.save({}, {
          success: function(model, response, options) {
            appState.set("selectedPointSetId", model.get("id"));
          }
        });
      }
    });

  },

  // Fetch after all hooks have been established to return to previous state
  phaseF: function() {

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
