var _ = require("underscore");

var express = require("express");
var router = express.Router();

var ImageModel = require("../models/image");

router.get("/", function(request, response) {
  response.send({"users": []});
});

function updateImageWithRequest(image, request) {
  _.extend(image, _.pick(request.body, ["name", "width", "height", "url", "comment"]));
}

router.route("/image")
  .post(function(request, response) {
    var image = new ImageModel();
    updateImageWithRequest(image, request);
    image.save(function(error) {
      if (error) {
        response.send(error);
      }
      response.json(image);
    });
  })
  .get(function(request, response) {
    ImageModel.find(function(error, images) {
      if (error) {
        response.send(error);
      }
      response.json(images);
    });
  });

router.route("/image/:imageId")
  .get(function(request, response) {
    ImageModel.findById(request.params.imageId, function(error, image) {
      if (error) {
        response.send(error);
      }
      response.json(image);
    });
  })
  .put(function(request, response) {
    ImageModel.findById(request.params.imageId, function(error, image) {
      if (error) {
        response.send(error);
      }
      updateImageWithRequest(image, request);
      image.save(function(error) {
        if (error) {
          response.send(error);
        }
        response.json(image);
      });
    });
  })
  .delete(function(request, response) {
    ImageModel.remove({_id: request.params.imageId}, function(error, image) {
      if (error) {
        response.send(error);
      }
      response.json({message: "successfully deleted"});
    });
  });

router.route("/image/name/:imageName")
  .get(function(request, response) {
    ImageModel.find({name: request.params.imageName}, function(error, image) {
      if (error) {
        response.send(error);
      }
      response.json(image);
    });
  });

router.get("/:id", function(request, response) {
  response.send(request.params.id);
});

module.exports = router;
