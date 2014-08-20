var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var annotationSetSchema = new Schema({
  annotation: {type: String, default: "", index: true},
  description: {type: String, default: ""},
  images: [Schema.Types.Mixed]
});

annotationSetSchema.statics.findByAnnotation = function(annotation, callback) {
  return this.find({annotation: annotation}, callback);
};

module.exports = mongoose.model("PointSet", annotationSetSchema);
