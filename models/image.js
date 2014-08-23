var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var imageSchema = new Schema({
  sha: {type: String, required: true, index: true},
  name: {type: String, required: true, index: true},
  filename: {type: String, required: true},
  url: {type: String, required: true},
  width: {type: Number, required: true},
  height: {type: Number, required: true},
  comment: String
});

module.exports = mongoose.model("Image", imageSchema);
