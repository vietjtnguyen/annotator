var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var groupSchema = new Schema({
  annotation: {type: String, default: "", index: true},
  image: {type: String, default: "", index: true, ref: "Image"},
  description: {type: String, default: ""},
});

module.exports = mongoose.model("Group", groupSchema);

