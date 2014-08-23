var path = require("path");

var _ = require("underscore");

var express = require("express");

module.exports = function createEndpoint(endpoint) {

  var collectionUrl = "/";
  endpoint.parentFields.forEach(function(parentField) {
    collectionUrl = path.join(collectionUrl, ":" + parentField.slug);
  });
  collectionUrl = path.join(collectionUrl, endpoint.slug);
  var itemUrl = path.join(collectionUrl, ":" + endpoint.idField.slug);

  console.log(collectionUrl);
  console.log(itemUrl);

  var router = express.Router();

  router.route(collectionUrl)
    .post(function(request, response) {
      var newModel = new endpoint.Model();
      _.extend(newModel, endpoint.contextFields);
      _.extend(newModel, _.pick(request.body, endpoint.bodyFields));
      endpoint.parentFields.forEach(function(parentField) {
        newModel[parentField.field] = request.params[parentField.slug];
      });
      console.log(request.params);
      console.log(request.body);
      console.log(newModel);
      newModel.save(function(error) {
        if (error) {
          response.send(error);
        }
        response.json(newModel);
      });
    })
    .get(function(request, response) {
      var query = {};
      endpoint.parentFields.forEach(function(parentField) {
        query[parentField.field] = request.params[parentField.slug];
      });
      console.log(request.params);
      console.log(request.body);
      console.log(query);
      endpoint.Model.find(query, function(error, models) {
        if (error) {
          response.send(error);
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
      console.log(request.params);
      console.log(request.body);
      console.log(query);
      endpoint.Model.findOne(query, function(error, model) {
        if (error) {
          response.send(error);
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
      console.log(request.params);
      console.log(request.body);
      console.log(query);
      endpoint.Model.findOne(query, function(error, model) {
        if (error) {
          response.send(error);
        }
        _.extend(model, endpoint.contextFields);
        _.extend(model, _.pick(request.body, endpoint.bodyFields));
        console.log(model);
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
      console.log(request.params);
      console.log(request.body);
      console.log(query);
      endpoint.Model.remove(query, function(error, model) {
        if (error) {
          response.send(error);
        }
        response.json({message: "successfully deleted"});
      });
    });

  return router;
};
