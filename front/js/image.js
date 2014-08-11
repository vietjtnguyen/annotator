// This model represents an image along with its meta data (width, height,
// actual URL, etc.). The images are separate from the annotations because
// multiple annotations can exist for each image.
var Image = Backbone.Model.extend({

  localStorage: new Backbone.LocalStorage("com.vietjtnguyen.annotator.Image"),

  defaults: {
    width: 0,
    height: 0,
    url: ""
  }

});
