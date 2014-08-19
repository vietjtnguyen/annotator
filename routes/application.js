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

router.get("/:annotationName/report", function(request, response) {
  PointSetModel
    .find({annotation: request.params.annotationName})
    .populate([{path: "image", select: "name"}])
    .exec(function(error, pointSets) {
      var groupedByImageName = _.groupBy(pointSets, function(i) { return i.image.name; });
      _.forEach(groupedByImageName, function(value, key, list) {
        groupedByImageName[key] = _.map(value, function(pointSet) {
          pointSet = _.pick(pointSet, ["points", "group", "description"]);
          pointSet.points = _.map(pointSet.points, function(point) { return _.pick(point, ["x", "y"]); });
          return pointSet;
        });
      });
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
