var path = require("path");

var _ = require("underscore");

var express = require("express");
var router = express.Router();

var ImageModel = require("../models/image");
var PointSetModel = require("../models/pointSet");

router.use("/:annotationName/set/:setName/:index", express.static(path.join(__dirname, "../public/app")));

router.get("/:annotationName/set/:setName", function(request, response) {
  response.send("This should be a list of images for set " + request.params.setName);
});

router.get("/:annotationName/set", function(request, response) {
  response.send("This should be a list of sets for annotation " + request.params.annotationName);
});

// This serves a "report" of the annotation data for the specified annotation
// path. The report is a JSON object with all point sets grouped by image.
router.get("/:annotationName/report", function(request, response) {
  PointSetModel
    // Get all point sets associated with this annotation.
    .find({annotation: request.params.annotationName})
    // Resolve image references in the point set (effectively "joining" the
    // image collection and point set collection using the point set's `image`
    // field as the join key). Also selects just the `name` field from the
    // images.
    .populate([{path: "image", select: "name"}])
    // Executes the find and populate queries.
    .exec(function(error, pointSets) {
      // Group all of the point sets by image name using Underscore.
      var groupedByImageName = _.groupBy(pointSets, function(i) { return i.image.name; });
      // Now we want to clean up our objects. We first iterate through all
      // image groups.
      _.forEach(groupedByImageName, function(value, key, list) {
        // Then we iterate through all point sets in each image group.
        groupedByImageName[key] = _.map(value, function(pointSet) {
          // For each point set we'll only keep the `points` array, `group`,
          // and `description`.
          pointSet = _.pick(pointSet, ["points", "group", "description"]);
          // Now go through each point in the `points` array and discard the
          // `id` field.
          pointSet.points = _.map(pointSet.points, function(point) { return _.pick(point, ["x", "y"]); });
          return pointSet;
        });
      });
      // Return our cleaned up hash object as a JSON response.
      response.json(groupedByImageName);
    });
});

router.use("/:annotationName/:imageName", express.static(path.join(__dirname, "../public/app")));

router.get("/:annotationName", function(request, response) {
  response.send("This should be a list of images and list of sets for annotation " + request.params.annotationName);
});

router.get("/", function(request, response) {
  response.send("This should be a list of annotations.");
});

module.exports = router;
