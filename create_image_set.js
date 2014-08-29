#!/usr/bin/env node
var fs = require("fs");
var mongoose = require("mongoose");

var ImageModel = require("./models/image");
var ImageSetModel = require("./models/imageSet");

var jsonFilename = process.argv[2];
var imageSetName = process.argv[3];

if (!jsonFilename || !imageSetName) {
  process.stderr.write("Usage: ./createImageSet.js jsonArrayFile.json imageSetName\n");
  process.exit(1);
}

mongoose.connect("mongodb://127.0.0.1/annotator");

var setQueries = JSON.parse(fs.readFileSync(jsonFilename, "utf8"));
var imageIds = [];
var errorQueries = [];
var index = -1;
var maxRetries = 2;
var retries = maxRetries;

var next = function() {
  index += 1;
  if (index < setQueries.length) {
    setQuery = setQueries[index];
    console.log(setQuery);
    ImageModel.findOne(setQuery, function(error, image) {
      if (!image) {
        error = "Could not find any matches.";
      }
      if (error || !image) {
        if (retries > 0) {
          console.log("Error with query {error: " + error + ", image: " + image + "}, " + retries + " retries left");
          index -= 1;
          retries -= 1;
          next();
        } else {
          console.log("Skipping");
          errorQueries.push({query: setQuery, error: error, image: image});
          retries = maxRetries;
          next();
        }
      } else {
        console.log(image._id);
        imageIds.push(image._id.toString());
        retries = maxRetries;
        next();
      }
    });
  } else {
    imageSet = {};
    imageSet.name = imageSetName;
    imageSet.imageIds = imageIds;
    imageSet.comment = "";
    ImageSetModel.update({name: imageSet.name}, imageSet, {upsert: true}, function (error) {
      if (error) {
        console.log("There was an error upserting the image set.");
        console.log(error);
        process.exit(1);
      }
      if (errorQueries.length > 0) {
        console.log("WARNING: " + errorQueries.length + " out of " + setQueries.length + " queries could not be fulfilled. These were not included in the final image set.");
        errorQueries.forEach(function(errorQuery) {
          console.log(errorQuery);
        });
        console.log("Successfully upserted " + imageIds.length + " images in image set (with " + errorQueries.length + " images missing).");
      } else {
        console.log("Successfully upserted " + imageIds.length + " image set.");
      }
      process.exit(0);
    });
  }
};

next();
