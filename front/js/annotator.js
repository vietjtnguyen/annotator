// Helpful links:
// http://stackoverflow.com/questions/9735513/how-to-place-a-div-on-the-right-side-with-absolute-position
// http://stackoverflow.com/questions/2469529/how-to-disable-scrolling-the-document-body
// http://css3gen.com/box-shadow/
// http://math.stackexchange.com/questions/296794/finding-the-transform-matrix-from-4-projected-points-with-javascript
// http://www.w3.org/TR/css3-transforms/#transform-functions
// http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
// http://stackoverflow.com/questions/6942785/browsers-think-differently-about-window-innerwidth-and-document-documentelement
// http://bl.ocks.org/mbostock/3892928
// http://bl.ocks.org/mbostock/6123708
// http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend
// http://getbootstrap.com/css
// http://getbootstrap.com/components
// http://backbonejs.org/#Model
// http://backbonejs.org/#Collection
// http://backbonejs.org/#FAQ-nested
// http://stackoverflow.com/questions/18504235/understand-backbone-js-rest-calls
// http://jstarrdewar.com/blog/2012/07/20/the-correct-way-to-override-concrete-backbone-methods/
// https://github.com/mbostock/d3/wiki/Selections#animation--interaction
//   The `this` context of an event callback in D3 is the DOM element.
// http://stackoverflow.com/questions/19851171/nested-backbone-model-results-in-infinite-recursion-when-saving
// http://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach
// http://stackoverflow.com/questions/1834642/best-practice-for-semicolon-after-every-function-in-javascript
// http://www.erichynds.com/blog/backbone-and-inheritance
// http://mjolnic.github.io/bootstrap-colorpicker/
// http://api.jquery.com/css/
// http://stackoverflow.com/questions/4633125/is-it-possible-to-get-all-arguments-of-a-function-as-single-object-inside-that-f
// http://tutorials.jenkov.com/svg/use-element.html
// http://stackoverflow.com/questions/19484707/how-can-i-make-an-svg-scale-with-its-parent-container

/*
 * Should objects trigger events on other objects or should they trigger events
 * on themselves that others must listen to? In order words, should an object
 * touch another object to notify them or should an object listen to another
 * object to get notifications?
 */

////////////////////////////////////////////////////////////////////////////////
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

  isInGroupMembershipMode: function() {
    var self = this;
    return self.get("selectedGroupId") !== "";
  },

});

////////////////////////////////////////////////////////////////////////////////
// Establish the application state and other models/views

var appState = new AppState();

// TODO: Might as well move these into the AppState initializer.
appState.currentImage = new Image();
appState.pointSets = new PointSetCollection([], {model: SinglePoint, appState: appState});
appState.pointSets.localStorage = new Backbone.LocalStorage("com.vietjtnguyen.annotator.SinglePoint");
appState.groups = new GroupCollection([], {appState: appState});

// Create views
appState.workingAreaView = new WorkingAreaView({appState: appState, el: $("body")[0]});
appState.utilityBoxView = new UtilityBoxView({appState: appState, el: $("#utilityBox")[0]});
appState.setListingView = new PointSetListView({appState: appState, el: $("#pointSetSection")[0]});
appState.groupListingView = new GroupListView({appState: appState, el: $("#groupSection")[0]});

////////////////////////////////////////////////////////////////////////////////
// Establish cross event hooks after all instances have been created

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

////////////////////////////////////////////////////////////////////////////////
// Fetch after all hooks have been established to return to previous state

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
  success: function() { console.log("points fetched"); },
  error: function() { console.log("error fetching points"); }
});
appState.groups.fetch({
  appState: appState,
  success: function() { console.log("groups fetched"); },
  error: function() { console.log("error fetching groups"); }
});

