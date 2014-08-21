Annotator
=========

Annotator is a back and front end solution for performing annotation of images
with discrete objects (e.g. points, lines, circles, polygons, polylines,
bounding boxes, etc.).  A data abstraction for discrete annotations based on
point sets is stored using [MongoDB](http://www.mongodb.org/). The data and the
application is served using [Node.js](http://nodejs.org/) and
[Mongoose](http://mongoosejs.com/). The front end application is a single-page
application built using HTML/CSS, Javascript, and SVG. Specifically it uses
[Backbone.js](http://backbonejs.org/) for synchronization with the database and
interface control while visualizing the actual annotations using SVG and
[D3.js](http://d3js.org/).

Annotation Types
----------------

- Line: two points, sets assigned a group
- PolyLine: n points
- Polygon: n points
- BoundingBox: 2 points, sets assigned a class
- Pose: n points, each assigned a class
- Skeleton: n predetermined points, each point

- Parallel Families: two points in a set, sets assigned a group, groups manageable
- Edges: n points in a set (polyline)
- Segmentation: n points in a set (polygon), sets assigned a class (type in, WordNet autocomplete)
- Objects: two points in a set (bounding box), sets assigned a class (type in, WordNet autocomplete)
- Pose: n (predetermined) points, each a (predetermined) class, lines drawn according to (predetermined) relationship
- Parts: n points in a set (polygon), sets assigned a class (type in, WordNet autocomplete), sets assigned a parent set (optional)

Installation
============

## Install Node.js

1. Go to [http://nodejs.org/](http://nodejs.org/), download the [install file](http://nodejs.org/dist/v0.10.31/node-v0.10.31.tar.gz)
2. Unpack with `tar zxvf node-v0.10.31.tar.gz`
3. `cd node-v0.10.31`
4. `./configure`
5. `make`
6. `sudo make install`
  - You might get a complaint while installing the `man` page: `OSError: [Errno 20] Not a directory: '/usr/local/share/man/man1/node.1'`. I simply did `sudo mv /usr/local/share/man/man1 /usr/local/share/man/man1.backup`.

## Install MongoDB

Follow the [instructions for installing on Ubuntu](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/), reproduced below.

1. `sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10`
2. `echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list`
3. `sudo apt-get update`
4. `sudo apt-get install mongodb-org`
5. `sudo service mongod start`
6. Wait a bit and then verify that the installation succeeded and the serviced started by running `mongo`. That will take you into a Mongo command-line interface where you can run `show dbs` which should return

```
admin  (empty)
local  0.078GB
```

## Install Annotator

1. Clone the Annotator repository: `git clone https://github.com/vietjtnguyen/annotator.git`
2. `cd annotator`
3. Install Node dependencies. `npm install`
4. Start the server. `npm start`

## Install Dataset

TODO

```
node imagePathToJson.bash public/image/pascal2010/trainval /image/pascal2010/trainval > image-models.json
mongoimport -d annotator -c images --type json --jsonArray --file image-models.json
```

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

Generic end points:

- `/{annotation_name}/{image_id}`
- `/{annotation_name}/name/{image_name}`
- `/{annotation_name}/set`
- `/{annotation_name}/set/{set_name}`
- `/{annotation_name}/set/{set_name}/{image_index}`
- `/api`
- `/api/image`
- `/api/image/{image_id}`
- `/api/image/name/{image_name}`
- `/api/{annotation_name}`
- `/api/{annotation_name}/set`
- `/api/{annotation_name}/set/{set_id}`
- `/api/{annotation_name}/set/name/{set_name}`
- `/api/{annotation_name}/{image_id}`
- `/api/{annotation_name}/{image_id}/group`
- `/api/{annotation_name}/{image_id}/group/{group_id}`
- `/api/{annotation_name}/{image_id}/point-set`
- `/api/{annotation_name}/{image_id}/point-set/{point_id}`

Specific end points (just examples):

- `/parallel-families/53f124db538701254c0bdb79`
- `/parallel-families/name/2008_000002`
- `/parallel-families/set`
- `/parallel-families/set/trainval`
- `/parallel-families/set/trainval/1`
- `/api/image`
- `/api/image/53f124db538701254c0bdb79`
- `/api/image/name/2008_000002`
- `/api/parallel-families`
- `/api/parallel-families/set`
- `/api/parallel-families/set/53f124db538701254c0bdb79`
- `/api/parallel-families/set/name/trainval`
- `/api/parallel-families/53f124db538701254c0bdb79`
- `/api/parallel-families/53f124db538701254c0bdb79/group`
- `/api/parallel-families/53f124db538701254c0bdb79/group/53f124db538701254c0bdb79`
- `/api/parallel-families/53f124db538701254c0bdb79/point-set`
- `/api/parallel-families/53f124db538701254c0bdb79/point-set/53f124db538701254c0bdb79`

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
- http://expressjs.com/api#req.params
- http://blog.modulus.io/nodejs-and-sqlite
- https://code.google.com/p/restful-sqlite/source/browse/web.py
- http://scotch.io/tutorials/javascript/build-a-restful-api-using-node-and-express-4
- http://mongoosejs.com/docs/guide.html
- http://mongoosejs.com/docs/schematypes.html
- http://mongoosejs.com/docs/api.html#model_Model.findOne
- http://mongoosejs.com/docs/api.html#model_Model.populate
- http://www.getpostman.com/
- http://css-tricks.com/snippets/javascript/get-url-and-url-parts-in-javascript/
- http://docs.mongodb.org/manual/reference/operator/query/in/
- http://underscorejs.org/#each
- http://underscorejs.org/#pluck
- https://github.com/NV/objectDiff.js
- https://github.com/benjamine/jsondiffpatch
- https://github.com/nilbus/Backbone.dualStorage
- http://thatextramile.be/blog/2012/01/hosting-a-node-js-site-through-apache
