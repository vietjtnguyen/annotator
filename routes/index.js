var path = require("path");

var express = require("express");
var router = express.Router();

router.use("/image", express.static(path.join(__dirname, "../public/image")));

router.get("/", function(request, response) {
  response.send("");
});

router.get("/:annotationName", function(request, response) {
  response.send("");
});

router.get("/:annotationName/:setName", function(request, response) {
  response.send("");
});

router.use("/:annotationName/:setName/:imageName", express.static(path.join(__dirname, "../public/app")));

module.exports = router;
