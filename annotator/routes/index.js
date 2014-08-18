var path = require("path");

var express = require("express");
var router = express.Router();

router.get("/", function(request, response) {
  response.send({"name": "Viet Nguyen", age: 28});
});

router.use("/annotator", express.static(path.join(__dirname, "../../front")));
router.use("/example-data", express.static(path.join(__dirname, "../../example-data")));

module.exports = router;
