// This module returns a function that can be used to generate/construct Express middleware that serves a REST-like API endpoint. The endpoint is defined using a hash object with the following keys:
//
// - `Model`: A [MongooseJS](http://mongoosejs.com/docs/models.html) model.
// - `contextFields`: Model fields that are to be filled with constant values when a model is updated (POST, PUT). Specified as a hash object.
// - `bodyFields`: An array of model fields that should be updated (POST, PUT) from the JSON body of a request. Note that if this is empty then no fields are drawn from the request body.
// - `parentFields`: An array of model fields that should be updated (POST, PUT) or used in model query (GET, DELETE) from the request URL. The fields are defined with a hash object containing a `slug` and `field`. The `slug` refers to the name used in the Express URL (i.e. it is prepended with `:` when constructing the URL). The `field` refers to the actual model field that the URL param will be mapped to.
// - `slug`: An intermediate URL segment name.
// - `idField`: A hash object defining a URL to model field map, the same as the individual items in `parentFields`. The hash object must have the `slug` and `field` properties.
//
// The URL associated with an endpoint definition is constructed as follows:
//
// - `/:parentField1Slug/:parentField2Slug/slug
//   - `GET`: Returns JSON array of all `Model`'s that match the parent fields.
//   - `POST`: Creates a new entry in `Model` based on `contextFields`, `bodyFields`, and `parentFields`.
// - `/:parentField1Slug/:parentField2Slug/slug/:idFieldSlug
//   - `GET`: Returns an entry in `Model` found using `contextFields` and `idField`.
//   - `PUT`: Updates an entry in `Model` based on `contextFields`, `bodyFields`, and `parentFields`. The entry is found using `contextFields` and `idField`.
//   - `DELETE`: Deletes an entry in `Model` found using `contextFields` and `idField`.
//
// The following is an example endpoint definition:
//
// ```
// example = {
//   Model: PointSetModel,
//   contextFields: {annotation: annotationName},
//   bodyFields: ["description", "group", "points"],
//   parentFields: [{slug: "image", field: "image"}],
//   slug: "point-set",
//   idField: {slug: "id", field: "_id"}
// }
// ```
//
// The example above results in the following endpoints:
//
// - `GET /:image/point-set`
// - `POST /:image/point-set`
// - `GET /:image/point-set/:id`
// - `PUT /:image/point-set/:id`
// - `DELETE /:image/point-set/:id`

// Path is used for the `join` method to construct URLs. I'm not sure yet if
// this is a good idea or not. At face value it seems fine.
var path = require("path");

// Underscore is used because it's so handy.
var _ = require("underscore");

// Express is needed since our generation function returns an Express router to
// be used as middleware.
var express = require("express");

// The module exports a function that generates middleware based on an endpoint
// definition.
module.exports = function createEndpoint(endpoint) {

  // Fill in any undefined endpoint definition fields.
  // <http://underscorejs.org/#defaults>
  endpoint = _.defaults(endpoint, {
    contextFields: {},
    bodyFields: [],
    parentFields: [],
    slug: "",
    idField: {}
  });

  // Define the collection URL. This URL returns an array of entries on GET and
  // creates a new entry on POST.
  var collectionUrl = "/";
  endpoint.parentFields.forEach(function(parentField) {
    collectionUrl = path.join(collectionUrl, ":" + parentField.slug);
  });
  collectionUrl = path.join(collectionUrl, endpoint.slug);

  // Define the item URL. This URL returns, updates, and deletes a single entry
  // on GET, PUT, and DELETE respectively.
  var itemUrl = path.join(collectionUrl, ":" + endpoint.idField.slug);

  // Create our Express router that will be our middleware.
  var router = express.Router();

  router.route(collectionUrl)
    .post(function(request, response) {
      var newModel = new endpoint.Model();
      _.extend(newModel, endpoint.contextFields);
      _.extend(newModel, _.pick(request.body, endpoint.bodyFields));
      endpoint.parentFields.forEach(function(parentField) {
        newModel[parentField.field] = request.params[parentField.slug];
      });
      newModel.save(function(error) {
        if (error) {
          response.json(500, {error: "Error saving model.", message: error});
        }
        response.json(newModel);
      });
    })
    .get(function(request, response) {
      var query = {};
      endpoint.parentFields.forEach(function(parentField) {
        query[parentField.field] = request.params[parentField.slug];
      });
      endpoint.Model.find(query, function(error, models) {
        if (error) {
          response.json(500, {error: "Error fetching models.", message: error});
        } else if (!models) {
          response.json(500, {error: "Error fetching models.", message: error});
        }
        response.json(models);
      });
    });

  router.route(itemUrl)
    .get(function(request, response) {
      var query = {};
      query[endpoint.idField.field] = request.params[endpoint.idField.slug];
      endpoint.parentFields.forEach(function(parentField) {
        query[parentField.field] = request.params[parentField.slug];
      });
      endpoint.Model.findOne(query, function(error, model) {
        if (error) {
          response.json(500, {error: "Error fetching model.", message: error});
        } else if (!model) {
          response.json(500, {error: "Model does not exist."});
        }
        response.json(model);
      });
    })
    .put(function(request, response) {
      var query = {};
      query[endpoint.idField.field] = request.params[endpoint.idField.slug];
      endpoint.parentFields.forEach(function(parentField) {
        query[parentField.field] = request.params[parentField.slug];
      });
      endpoint.Model.findOne(query, function(error, model) {
        if (error) {
          response.json(500, {error: "Error updating model.", message: error});
        } else if (!model) {
          response.json(500, {error: "Model does not exist."});
        }
        _.extend(model, endpoint.contextFields);
        _.extend(model, _.pick(request.body, endpoint.bodyFields));
        endpoint.parentFields.forEach(function(parentField) {
          model[parentField.field] = request.params[parentField.slug];
        });
        model.save(function(error) {
          if (error) {
            response.send(error);
          }
          response.json(model);
        });
      });
    })
    .delete(function(request, response) {
      var query = {};
      query[endpoint.idField.field] = request.params[endpoint.idField.slug];
      endpoint.parentFields.forEach(function(parentField) {
        query[parentField.field] = request.params[parentField.slug];
      });
      endpoint.Model.remove(query, function(error, model) {
        if (error) {
          response.json(500, {error: "Error deleting model.", message: error});
        } else if (!model) {
          response.json(500, {error: "Model does not exist."});
        }
        response.json({message: "successfully deleted"});
      });
    });

  return router;
};
