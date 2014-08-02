Annotator
=========

Annotator is a back and front end solution for performing annotation of images
with discrete objects (e.g. points, lines, circles, polygons, polylines, etc.).
The back end involves a data model for images and a user defined data model for
annotations stored using SQLite3 served as a RESTful service via Python/Flask.
The front end involves a single-page application built using HTML/CSS/JS/SVG.
Specifically it uses Backbone.js to manage data model synchrony with the back
and and d3.js for visualization and control.

Image Data Model
----------------

### API

The API for images is as follows:

#### `/image/<pk>`

Get's the information associated with an image.

```
{
  "name": "2008_000003",
  "url": "/example-data/2008_000003.jpg",
  "width": 500,
  "height": 300,
  "channels": 3,
  "size": 44282,
  "notes": "from PASCAL"
}
```
