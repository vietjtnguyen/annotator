var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var imageSetSchema = new Schema({
  name: {type: String, required: true, index: true, unique: true},
  imageIds: [{type: String}],
  comment: String
});

module.exports = mongoose.model("ImageSet", imageSetSchema);
