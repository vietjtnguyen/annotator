// Here we establish API URL for the whole application. If the application is
// not hosted at the root URL (i.e. in a sub-folder like
// `http://my.domain.com/sub-folder`) then `rootUrl` needs to be set to that
// sub-folder (`rootUrl = "subFolder";` in the example).
var rootUrl = "";
var baseApiUrl = urljoin(window.location.protocol + "//" + window.location.host, rootUrl);

// User State
// ----------
//
// This model saves user settings in local storage. User settings include
// background color, grid visibility, and line color. These are settings that
// persist across annotations, images, and sets. This model owns these
// properties. The visuals representing these properties respond to change
// events on this model's fields (such as `WorkingAreaView`).
var UserState = Backbone.Model.extend({

// The "user" in "user state" is a bit of a misnomer as there currently isn't
// support for user accounts yet. Instead the state is effectively stored for
// the user by using local storage.
  localStorage: new Backbone.LocalStorage("annotator-userstate"),

// Attributes:
  defaults: {

// `id`: This ID is just here to uniquely identifer one user state in local
// storage so that when we call
// [`Backbone.Model.fetch`](http://backbonejs.org/#Model-fetch) or
// [`Backbone.Model.save`](http://backbonejs.org/#Model-save) it grabs/saves
// the same model every time.
    id: "local",

// `background`: A binary enumeration (`"light"` or `"dark"`) determining if
// the background of the working area is light or dark.
    background: "light",

// `grid`: A binary enumeration (`"off"` or `"on"`) determining if the
// background grid is visible or not.
    grid: "off",

// `lineColor`: A CSS color string for the color of ungrouped lines.
    lineColor: "#f0f",
  }
});

// Application State
// -----------------
//
// This model represents the application state and doubly serves as the root
// namespace for the application in the sense that point sets, views, and more
// are attached to this model, but not as attributes. It should act as a global
// singleton available everywhere by polluting the global namespace with its
// instance as `app`. This model is also never saved (to local storage or a
// server).
//
// The application consist of five primary views:
// 
// - Working area: Contains the image and point set visualizations. Primarily
//   controlled using D3 inside the `WorkingAreaView` Backbone view.
// - Tool pane: Contains the following three sections. Is not represented
//   explicitly by a Backbone view.
//   - Image set control: Contains the widgets to control navigation within an
//     image set. These widgets are simple, statically defined HTML DOM
//     elements with simple interactions. As such there is no special
//     processing (no D3), and all events can be handled directly with the
//     Backbone view `ImageSetControlView`.
//   - Group list section: Contains the button to add a group and the
//     collection of widgets that allow manipulation of individual groups.
//     Handled by the Backbone view `GroupListView`.
//     - Group lits item: Contains the button to select and remove a specific
//       group. Handled by the Backbone view `GroupListItemView`.
//   - Point set list section: Contains the button to add a point set and the
//     collection of widgets thta allow manipulation of individual point sets.
//     Handled by Backbone view `PointSetListView`.
//     - Point set list item: Contains the button to select and remove a
//       specific point set. Handled by the Backbone view
//       `PointSetListItemView`.
// - Utility box: This box floats in the top-left corner and contains the
//   widgets to control user settings.
//
// Since this model is both a model and an object we distinguish attributes
// from member properties. When we say attributes we refer to Backbone
// attributes that must be accessed via `Backbone.Model`'s `get` and `set`
// methods. When we say member properties we refer to object properties
// accessible directly either via the `.` operator or `[]` indexing like any
// other Javascript hash object. These member properties are used to treat the
// `AppState` object as an application level namespace.
//
// Also worth noting is that all attributes can be thought of as "owned" by the
// application state in the sense that any modification of these states goes
// through the application state and everyone else must react to changes via
// the Backbone event system (e.g.
// [`listenTo`](http://backbonejs.org/#Events-listenTo)).
var AppState = Backbone.Model.extend({

// Attributes:
  defaults: {

// - `selectedPointSetId`: Currently selected point set. Only one point set can
//   be selected at a time.
    selectedPointSetId: "",

// - `selectedGroupId`: Currently selected group. Only one group set can be
//   selected at a time. When a group is selected the application goes into
//   "group membership mode" where point set selection toggles the selected
//   group as the point set's group.
    selectedGroupId: "",

// - `zoom`: This object contains two properties that represent the pan/zoom of
//   the working area: `translate` and `scale`.
//   - `translate`: A two element array of numbers representing the translate
//     vector.
//   - `scale`: A single number as zoom multipler.
    zoom: {
      translate: [0, 0],
      scale: 1
    }
  },

// Properties:
//
// - `userState`
// - `currentImage`
// - `currentImageSet`
// - `currentImageSetIndex`
// - `pointSets`
// - `groups`
// - `utilityBoxView`
// - `imageSetControlView`
// - `workingAreaView`
// - `setListingView`
// - `groupListingView`

  initialize: function() {
    var self = this;

    // Create the user state. This model doesn't get deleted or destroyed. It
    // exists to be filled with a saved state from local storage via a
    // `Backbone.Model.fetch`.
    self.userState = new UserState();

    // Populate the current image. This model doesn't get deleted or destroyed.
    // If the image changes then the ID is changed and a fetch performed.
    self.currentImage = new Image();

    // Create the current image set. This model, like the above, doesn't get
    // deleted or destroyed.
    self.currentImageSet = new ImageSet();
    self.currentImageSetIndex = 0;

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

    self.imageSetControlView = new ImageSetControlView({appState: self, el: $("#imageSetControlSection")[0]});

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

    // Have the point set listen to the working area view for any "canvas clicks"
    // to know when to add points to the selected point set.
    self.listenTo(self.workingAreaView, "workingAreaClick", self.addNewPoint);
  },

  isInGroupMembershipMode: function() {
    var self = this;
    return self.get("selectedGroupId") !== "";
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

var appState = new AppState();

var AppRouter = Backbone.Router.extend({

  routes: {
    "parallel-lines/:imageName": "parallelLinesDirect",
    "parallel-lines/:imageName/": "parallelLinesDirect",
    "parallel-lines/set/:setName/:index": "parallelLinesSet",
    "parallel-lines/set/:setName/:index/": "parallelLinesSet"
  },

  // This handles loading an image directly by image name. Corresponds to URL
  // `parallel-lines/:imageName`. The general idea is as follows:
  //
  // 1. Have image name.
  // 2. Get image using image name.
  // 3. Update everything based on image information.
  parallelLinesDirect: function(imageName) {
    var self = this;

    // First we'll load any user state saved in local storage. If it isn't
    // there then the user state model just keeps its defaults.
    appState.userState.fetch({
      appState: appState,
      success: function() {
      },
      error: function() {
      }
    });

    appState.currentImageSet.clear(); // TODO: Should this be silent?
    appState.currentImageSetIndex = 0;
    // TODO: Hide image set control view.

    // This is specified here because we're suppose to support different point
    // set models later (for polylines, polygons, bounding boxes, etc.). For
    // now since we're dealing explicitly with the parallel lines annotation
    // we'll specify this as a line.
    appState.pointSets.model = Line;
    appState.setListingView.setPointSetType("Line");

    // Now update our current image model with the image name.
    appState.currentImage.idAttribute = "name";
    appState.currentImage.set("name", imageName);
    appState.currentImage.urlRoot = urljoin(baseApiUrl, "/api/image/name/");

    // Now that our current image model has the proper name and API URL we
    // can just fetch the image information including dimensions and
    // resource URL.
    appState.currentImage.fetch({
      success: function() {

        // The image dimensions have likely changed so we'll reset the view
        // to center on the image.
        appState.utilityBoxView.resetView();

        // Now one would expect to update the image `href` in the working
        // area here but is actually done in response to a `change:url`
        // event triggered when the current image fetches and updates.

        // We couldn't update the point sets and groups concurrently because
        // before we only had the image name but we need the image ID for the
        // API. Now that we have the image ID here, we can update the API end
        // points for the point set and group collections.
        // 
        // TODO: Should there be an image name based API end point?
        appState.pointSets.url = urljoin(baseApiUrl, "/api/parallel-lines/", appState.currentImage.get("_id"), "/point-set/");
        appState.groups.url = urljoin(baseApiUrl, "/api/parallel-lines/", appState.currentImage.get("_id"), "/group/");

        // Now we just fetch the point sets, allowing the collection to remove
        // any existing point sets.
        appState.pointSets.fetch({
          appState: appState,
          remove: true,
          success: function() {
          },
          error: function() {
          }
        });

        // Same goes for the groups.
        appState.groups.fetch({
          appState: appState,
          remove: true,
          success: function() {
          },
          error: function() {
          }
        });
      },
      error: function() {
        appState.pageAlert("danger", "Error while fetching image. Image \"" + appState.currentImage.get("_id") + "\" likely does not exist.");
        // TODO: Add application disable/enable.
        appState.stopListening();
      }
    });
  },

  // This handles loading an image by indexing into an image set. Corresponds
  // to URL `parallel-lines/set/:setName/:index`. The general idea is as
  // follows:
  //
  // 1. Have image set name and index.
  // 2. Get image set using image set name.
  // 3. Get image ID from image set and index.
  // 4. Get image using image ID.
  // 5. Update everything based on image information.
  parallelLinesSet: function(setName, index) {
    var self = this;

    // First we'll load any user state saved in local storage. If it isn't
    // there then the user state model just keeps its defaults.
    appState.userState.fetch({
      appState: appState,
      success: function() {
      },
      error: function() {
      }
    });

    // Next we'll make sure the index is an integer.
    appState.currentImageSetIndex = parseInt(index);
    if (!appState.currentImageSetIndex) {

      // TODO: The following should be part of an application wide
      // enable/disable functionality to kill interface functionality when
      // there's an error that we can't recover from.
      appState.pageAlert("danger", "Image index is invalid.");
      appState.stopListening();

      return;
    }

    // Now that we have a valid index let's rerender the image set control view
    // so that the number in the entry field updates.
    appState.imageSetControlView.render();

    // This is specified here because we're suppose to support different point
    // set models later (for polylines, polygons, bounding boxes, etc.). For
    // now since we're dealing explicitly with the parallel lines annotation
    // we'll specify this as a line.
    appState.pointSets.model = Line;
    appState.setListingView.setPointSetType("Line");

    // Next we grab the entire image set. We have an *image set name* but we
    // need to end up with an *image model*. So the first step is to get the
    // image set from the image set name because the image set contains a list
    // of image IDs that we can use to grab the image model itself.
    appState.currentImageSet.set("name", setName);
    appState.currentImageSet.urlRoot = urljoin(baseApiUrl, "/api/image-set/name");
    appState.currentImageSet.fetch({
      success: function() {

        // If we've made it here then we successfully fetched and updated the
        // image set. We'll chuck the array of image IDs into a variable for
        // convenience.
        var imageIds = appState.currentImageSet.get("imageIds");

        // Next we verify that the index we have is not out of bounds for this
        // image set. The index starts at one.
        if (appState.currentImageSetIndex < 1 || appState.currentImageSetIndex > imageIds.length) {
          appState.pageAlert("danger", "Image index is out of range.");
          // TODO: Add application disable/enable.
          appState.stopListening();
          return;
        }

        // Now we'll grab the image ID from the image set and use it to update
        // our current image model.
        var imageId = imageIds[appState.currentImageSetIndex - 1];
        appState.currentImage.idAttribute = "_id";
        appState.currentImage.set("_id", imageId);
        appState.currentImage.urlRoot = urljoin(baseApiUrl, "/api/image/");

        // Now that our current image model has the proper ID and API URL we
        // can just fetch the image information including dimensions and
        // resource URL.
        appState.currentImage.fetch({
          success: function() {

            // The image dimensions have likely changed so we'll reset the view
            // to center on the image.
            appState.utilityBoxView.resetView();

            // Now one would expect to update the image `href` in the working
            // area here but is actually done in response to a `change:url`
            // event triggered when the current image fetches and updates.
          },
          error: function() {
            appState.pageAlert("danger", "Error while fetching image. Image \"" + appState.currentImage.get("_id") + "\" likely does not exist.");
            // TODO: Add application disable/enable.
            appState.stopListening();
          }
        });

        // While the image is fetching we can also grab the point sets and
        // groups for this image and annotation type. First we'll need to
        // update the API end points for the collections.
        appState.pointSets.url = urljoin(baseApiUrl, "/api/parallel-lines/", appState.currentImage.get("_id"), "/point-set/");
        appState.groups.url = urljoin(baseApiUrl, "/api/parallel-lines/", appState.currentImage.get("_id"), "/group/");

        // Now we just fetch the point sets, allowing the collection to remove
        // any existing point sets.
        appState.pointSets.fetch({
          appState: appState,
          remove: true,
          success: function() {
          },
          error: function() {
          }
        });

        // Same goes for the groups.
        appState.groups.fetch({
          appState: appState,
          remove: true,
          success: function() {
          },
          error: function() {
          }
        });
      },
      error: function() {
        appState.pageAlert("danger", "Error while fetching image set. Image set \"" + appState.currentImageSet.get("name") + "\" likely does not exist.");
        // TODO: Add application disable/enable.
        appState.stopListening();
      }
    });
  },

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
