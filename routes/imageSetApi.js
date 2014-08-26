var _ = require("underscore");
var express = require("express");

var ImageSetModel = require("../models/imageSet");
var generateEndpoint = require("./generateEndpoint");

var router = express.Router();

router.use(generateEndpoint({
  readOnly: true,
  Model: ImageSetModel,
  contextFields: {},
  bodyFields: ["name", "imageIds", "comment"],
  parentFields: [],
  slug: "",
  idField: {slug: "id", field: "_id"}
}));

router.use(generateEndpoint({
  readOnly: true,
  Model: ImageSetModel,
  contextFields: {},
  bodyFields: ["imageIds", "comment"],
  parentFields: [],
  slug: "name",
  idField: {slug: "name", field: "name"}
}));

module.exports = router;
