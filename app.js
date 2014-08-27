var path = require("path");

var express = require("express");
var mongoose   = require("mongoose");

var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var imageApiRoute = require("./routes/imageApi");
var imageSetApiRoute = require("./routes/imageSetApi");
var annotationApiRoute = require("./routes/annotationApi");
var applicationRoute = require("./routes/application");

mongoose.connect("mongodb://127.0.0.1/annotator");

var app = express();

app.set("env", "development");
app.set("view options", {layout: false});

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/parallel-lines", annotationApiRoute("parallel-lines"));
app.use("/api/image-set", imageSetApiRoute);
app.use("/api/image", imageApiRoute);
app.use("/image", express.static(path.join(__dirname, "./public/image")));
app.use("/", applicationRoute);

// If we've gotten here then none of the above "middleware" returned a
// response. We have no more middleware below to do any work so we"ve hit a
// 404.
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error-handling middleware is defined just like regular middleware, except
// that it must be defined with an arity of 4. Note that the below development
// error handler will print a stack trace. When in production we"ll want to use
// the error handler after this one.
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// This production error handler won't leak information by printing a stack
// trace.
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
