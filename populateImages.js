var child_process = require("child_process");
var fs = require("fs");
var path = require("path");

var _ = require("underscore");
var mongoose   = require("mongoose");

var ImageModel = require("./models/image");

// Grab arguments.
var imagePath = process.argv[2];
var baseUrl = process.argv[3];

// Verify arguments.
if (imagePath === undefined || baseUrl === undefined) {
  console.log("node populateImages.js ./path/to/images /base/url");
  process.exit(1);
}

// Get all files in the path argument.
var files = fs.readdirSync(imagePath);

// Get just image files.
var imageRegex = /\.(bmp|gif|jpg|jpeg|png|tif|tiff)$/i;
var imageFiles = _.filter(files, function(fileName) { return imageRegex.exec(fileName); });

// Connect to our local MongoDB.
mongoose.connect("mongodb://127.0.0.1/annotator");

// Read all files in the provided path.
imageFiles.forEach(function(imageFileName) {

  var fullImagePath = path.join(imagePath, imageFileName);

  // Create a new instance of the image model.
  var image = new ImageModel();

  // Populate the name and URL.
  image.name = imageFileName;
  image.url = path.join(baseUrl, imageFileName);

  // Run ImageMagick (`convert` command) to extract the width and height of the
  // image.
  var cmd = "convert " + fullImagePath + " -print '{width: %w, height: %h}' /dev/null";
  var child = child_process.exec(cmd, {},
    function(err, stdout, stderr) {
      var dimensions = JSON.parse(stdout);
      image.width = dimensions.width;
      image.height = dimensions.height;
      console.log(image);
      child.kill();
    }
  );


  // // Save the image into the database.
  // image.save(function(error) {
  //   if (error) {
  //     response.send(error);
  //   }
  //   response.json(image);
  // });
});
