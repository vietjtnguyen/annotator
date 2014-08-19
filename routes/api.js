var _ = require("underscore");

var express = require("express");
var router = express.Router();

var ImageModel = require("../models/image");
var PointSetModel = require("../models/pointSet");



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

router.route("/image/name")
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

router.route("/image/name/:imageName")
  .get(function(request, response) {
    ImageModel.findByName(request.params.imageName, function(error, image) {
      if (error) {
        response.send(error);
      }
      response.json(image);
    });
  })
  .put(function(request, response) {
    ImageModel.findByName(request.params.imageName, function(error, image) {
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
    ImageModel.remove({name: request.params.imageName}, function(error, image) {
      if (error) {
        response.send(error);
      }
      response.json({message: "successfully deleted"});
    });
  });



function updatePointSetWithRequest(pointSet, request) {
  pointSet.annotation = request.params.annotationName;
  pointSet.image = request.params.imageId;
  pointSet.description = request.body.description;
  pointSet.group = request.body.group;
  pointSet.points = request.body.points;
}

router.route("/:annotationName/:imageId/point-set")
  .post(function(request, response) {
    var pointSet = new PointSetModel();
    updatePointSetWithRequest(pointSet, request);
    pointSet.save(function(error) {
      if (error) {
        response.send(error);
      }
      response.json(pointSet);
    });
  })
  .get(function(request, response) {
    PointSetModel.find({
      annotation: request.params.annotationName,
      image: request.params.imageId
    }, function(error, pointSets) {
      if (error) {
        response.send(error);
      }
      response.json(pointSets);
    });
  });

router.route("/:annotationName/:imageId/point-set/:pointSetId")
  .get(function(request, response) {
    PointSetModel.findById(request.params.pointSetId, function(error, pointSet) {
      if (error) {
        response.send(error);
      }
      response.json(pointSet);
    });
  })
  .put(function(request, response) {
    PointSetModel.findById(request.params.pointSetId, function(error, pointSet) {
      if (error) {
        response.send(error);
      }
      updatePointSetWithRequest(pointSet, request);
      pointSet.save(function(error) {
        if (error) {
          response.send(error);
        }
        response.json(pointSet);
      });
    });
  })
  .delete(function(request, response) {
    PointSetModel.remove({_id: request.params.pointSetId}, function(error, pointSet) {
      if (error) {
        response.send(error);
      }
      response.json({message: "successfully deleted"});
    });
  });



module.exports = router;
