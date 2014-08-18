var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var pointSetSchema = new Schema({
  description: String,
  group: String,
  points: [Schema.Types.Mixed]
});

module.exports = mongoose.model("PointSet", pointSetSchema);
