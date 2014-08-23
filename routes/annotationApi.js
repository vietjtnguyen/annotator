var _ = require("underscore");
var express = require("express");

var PointSetModel = require("../models/pointSet");
var GroupModel = require("../models/group");

var generateEndpoint = require("./generateEndpoint");

module.exports = function(annotationName) {

  var router = express.Router();

  router.use(generateEndpoint({
    Model: PointSetModel,
    contextFields: {annotation: annotationName},
    bodyFields: ["description", "group", "points"],
    parentFields: [{slug: "image", field: "image"}],
    slug: "point-set",
    idField: {slug: "id", field: "_id"}
  }));

  router.use(generateEndpoint({
    Model: GroupModel,
    contextFields: {annotation: annotationName},
    bodyFields: ["description"],
    parentFields: [{slug: "image", field: "image"}],
    slug: "group",
    idField: {slug: "id", field: "_id"}
  }));
  
  console.log("made it");
  
  return router;

};
