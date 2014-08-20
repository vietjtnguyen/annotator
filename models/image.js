var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var imageSchema = new Schema({
  name: {type: String, required: true, index: true},
  width: {type: Number, required: true},
  height: {type: Number, required: true},
  url: {type: String, required: true},
  comment: String
});

imageSchema.statics.findByName = function(name, callback) {
  return this.findOne({name: name}, callback);
};

module.exports = mongoose.model("Image", imageSchema);
