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
var index = -1;

var next = function() {
  index += 1;
  if (index < setQueries.length) {
    setQuery = setQueries[index];
    ImageModel.findOne(setQuery, function(error, image) {
      if (error || !image) {
        console.log("Error with query " + JSON.stringify(setQuery));
      } else {
        console.log(image._id);
        imageIds.push(image._id.toString());
      }
      next();
    });
  } else {
    imageSet = {};
    imageSet.name = imageSetName;
    imageSet.imageIds = imageIds;
    ImageSetModel.update({name: imageSet.name}, imageSet, {upsert: true}, function (error) {
      if (error) {
        console.log("There was an error saving the image set.");
        console.log(error);
      }
      console.log("Successfully upserted image set.");
      process.exit(0);
    });
  }
};

next();

