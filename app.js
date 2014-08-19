var path = require("path");

var express = require("express");

var app = express();

var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

app.set("view options", {layout: false});

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var mongoose   = require("mongoose");
mongoose.connect("mongodb://127.0.0.1/annotator");

// Statically serve the images.
app.use("/image", express.static(path.join(__dirname, "./public/image")));

// Attach our middleware to the app.
app.use("/api", require("./routes/api"));
app.use("/", require("./routes/application"));

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

// This production error handler won"t leak information by printing a stack
// trace.
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
