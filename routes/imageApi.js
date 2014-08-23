var _ = require("underscore");
var express = require("express");

var ImageModel = require("../models/image");
var generateEndpoint = require("./generateEndpoint");

var router = express.Router();

router.use(generateEndpoint({
  Model: ImageModel,
  contextFields: {},
  bodyFields: ["name", "width", "height", "url", "comment"],
  parentFields: [],
  slug: "",
  idField: {slug: "id", field: "_id"}
}));

router.use(generateEndpoint({
  Model: ImageModel,
  contextFields: {},
  bodyFields: ["name", "width", "height", "url", "comment"],
  parentFields: [],
  slug: "sha",
  idField: {slug: "sha", field: "sha"}
}));

router.use(generateEndpoint({
  Model: ImageModel,
  contextFields: {},
  bodyFields: ["name", "width", "height", "url", "comment"],
  parentFields: [],
  slug: "name",
  idField: {slug: "name", field: "name"}
}));

module.exports = router;
