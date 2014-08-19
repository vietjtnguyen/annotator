var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var pointSetSchema = new Schema({
  annotation: {type: String, default: "", index: true},
  image: {type: String, default: "", index: true, ref: "Image"},
  description: {type: String, default: ""},
  group: {type: String, default: ""},
  points: [Schema.Types.Mixed]
});

pointSetSchema.statics.findByAnnotationImage = function(annotation, image, callback) {
  this.find({annotation: annotation, image: image}, callback);
};

module.exports = mongoose.model("PointSet", pointSetSchema);
