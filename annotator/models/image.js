var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var imageSchema = new Schema({
  name: {type: String, required: true, unique: true},
  width: {type: Number, required: true},
  height: {type: Number, required: true},
  url: {type: String, required: true},
  comment: String
});

module.exports = mongoose.model("Image", imageSchema);
