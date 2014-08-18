Annotator
=========

Annotator is a back and front end solution for performing annotation of images
with discrete objects (e.g. points, lines, circles, polygons, polylines, etc.).
The back end involves a data model for images and a user defined data model for
annotations stored using SQLite3 served as a RESTful service via Python/Django.
The front end involves a single-page application built using HTML/CSS/JS/SVG.
Specifically it uses Backbone.js to manage data model synchrony with the back
end and d3.js for visualization and control.

Annotation Types
----------------

Line: two points, sets assigned a group
PolyLine: n points
Polygon: n points
BoundingBox: 2 points, sets assigned a class
Pose: n points, each assigned a class
Skeleton: n predetermined points, each point

Parallel Families: two points in a set, sets assigned a group, groups manageable
Edges: n points in a set (polyline)
Segmentation: n points in a set (polygon), sets assigned a class (type in, WordNet autocomplete)
Objects: two points in a set (bounding box), sets assigned a class (type in, WordNet autocomplete)
Pose: n (predetermined) points, each a (predetermined) class, lines drawn according to (predetermined) relationship
Parts: n points in a set (polygon), sets assigned a class (type in, WordNet autocomplete), sets assigned a parent set (optional)

Developer Stuff
===============

Event Flow
----------

Objects:

- AppState
  - Acts as the hub and top-level namespace. All objects have a reference to AppState.
- PointSetCollection: a collection of point sets
- PointSet
- GroupCollection: a collection of groups
- Group

Views:

- UtilityBox
- VisArea
  - PointSetVis (PointSet)
- PointSetList (PointSetCollection)
  - PointSetListItem (PointSet)
- GroupList (GroupCollection)
  - GroupListItem (Group)

Actions:

- AppState:ZoomPan
  - Changes AppState directly
  - Triggers AppState change event
  - VisArea view responds to AppState change event
- UtilityBox:ResetView
  - Changes AppState directly
  - Triggers AppState change event
  - VisArea view responds to AppState change event
- UtilityBox:ToggleBG
  - Changes AppState directly
  - Triggers AppState change event
  - VisArea view responds to AppState change event
- UtilityBox:ToggleGrid
  - Changes AppState directly
  - Triggers AppState change event
  - VisArea view responds to AppState change event
- UtilityBox:LineColor
  - Changes AppState directly
  - Triggers AppState change event
  - AppState triggers rerender event
  - PointSetVis responds to AppState rerender event
  - PointSetListItem responds to AppState rerender event
- PointSetVis:Point:Click
- PointSetVis:Point:Drag
- PointSetVis:Polygon:Click
- PointSetList:Add:Click
- PointSetListItem:Click
- PointSetListItem:Remove:Click
  - Kicks off removal transition on PointSetListItem
  - Triggers PointSet removal event
  - PointSetVis responds to PointSet removal event
  - PointSetVis kicks off removal transition
  - When PointSetListItem removal transition ends, destroys PointSet direction
  - PointSet destruction triggers PointSet destroy event
  - PointSetListItem responds to PointSet destroy event by removing self
  - PointSetVis responds to PointSet destroy event by removing self
- GroupList:Add:Click
  - Adds a Group to the GroupCollection
  - Triggers GroupCollection add event
  - GroupList responds to GroupCollection add event
  - New GroupListItemView is created
- GroupListItem:Click
  - Changes GroupListing selection directly
  - Triggers GroupListing change event
  - AppState responds to GroupListing change event
  - AppState triggers rerender event
  - PointSetVis responds to AppState rerender event
  - PointSetListItem responds to AppState rerender event
- GroupListItem:Remove:Click
  - Kicks off removal transition on GroupListItem
  - When GroupListItem removaltransition ends, destroys Group
  - Group destruction triggers Group destroy event
  - GroupListItem responds to Group destroy event by removing self

API
---

/parallel-families
/parallel-families/trainval
/parallel-families/trainval/2008_000003
/api/image/53f124db538701254c0bdb79
/api/parallel-familes
/api/parallel-familes/2008_000003
/api/parallel-familes/2008_000003/group
/api/parallel-familes/2008_000003/point-set
/api/parallel-familes/2008_000003/point-set/53f124db538701254c0bdb79

/{annotation_name}/{set_name}
/{annotation_name}/{set_name}/{image_name}
/api
/api/image/{image_id}
/api/{annotation_name}
/api/{annotation_name}/{image_name}
/api/{annotation_name}/{image_name}/pointset/{point_id}
/api/{annotation_name}/{image_name}/group/{group_id}

Helpful Links
-------------

- http://stackoverflow.com/questions/9735513/how-to-place-a-div-on-the-right-side-with-absolute-position
- http://stackoverflow.com/questions/2469529/how-to-disable-scrolling-the-document-body
- http://css3gen.com/box-shadow/
- http://math.stackexchange.com/questions/296794/finding-the-transform-matrix-from-4-projected-points-with-javascript
- http://www.w3.org/TR/css3-transforms/#transform-functions
- http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
- http://stackoverflow.com/questions/6942785/browsers-think-differently-about-window-innerwidth-and-document-documentelement
- http://bl.ocks.org/mbostock/3892928
- http://bl.ocks.org/mbostock/6123708
- http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend
- http://getbootstrap.com/css
- http://getbootstrap.com/components
- http://backbonejs.org/#Model
- http://backbonejs.org/#Collection
- http://backbonejs.org/#FAQ-nested
- http://stackoverflow.com/questions/18504235/understand-backbone-js-rest-calls
- http://jstarrdewar.com/blog/2012/07/20/the-correct-way-to-override-concrete-backbone-methods/
- https://github.com/mbostock/d3/wiki/Selections#animation--interaction
  - The `this` context of an event callback in D3 is the DOM element.
- http://stackoverflow.com/questions/19851171/nested-backbone-model-results-in-infinite-recursion-when-saving
- http://stackoverflow.com/questions/6535948/nested-models-in-backbone-js-how-to-approach
- http://stackoverflow.com/questions/1834642/best-practice-for-semicolon-after-every-function-in-javascript
- http://www.erichynds.com/blog/backbone-and-inheritance
- http://mjolnic.github.io/bootstrap-colorpicker/
- http://api.jquery.com/css/
- http://stackoverflow.com/questions/4633125/is-it-possible-to-get-all-arguments-of-a-function-as-single-object-inside-that-f
- http://tutorials.jenkov.com/svg/use-element.html
- http://stackoverflow.com/questions/19484707/how-can-i-make-an-svg-scale-with-its-parent-container
- http://stackoverflow.com/questions/319530/restful-authentication
- http://blog.synopse.info/post/2011/05/24/How-to-implement-RESTful-authentication
- https://togetherjs.com/
- https://flask-login.readthedocs.org/en/latest/
- http://expressjs.com/4x/api.html
- http://blog.modulus.io/nodejs-and-sqlite
- https://code.google.com/p/restful-sqlite/source/browse/web.py
- http://scotch.io/tutorials/javascript/build-a-restful-api-using-node-and-express-4
- http://mongoosejs.com/docs/guide.html
- http://www.getpostman.com/
