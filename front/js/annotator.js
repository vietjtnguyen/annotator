/*
 * Helpful links:
 * http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
 * http://stackoverflow.com/questions/6942785/browsers-think-differently-about-window-innerwidth-and-document-documentelement
 * http://bl.ocks.org/mbostock/3892928
 * http://bl.ocks.org/mbostock/6123708
 * http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend
 * http://getbootstrap.com/css
 * http://getbootstrap.com/components
 * http://backbonejs.org/#Model
 * http://backbonejs.org/#Collection
 * http://backbonejs.org/#FAQ-nested
 * http://stackoverflow.com/questions/18504235/understand-backbone-js-rest-calls
 * http://jstarrdewar.com/blog/2012/07/20/the-correct-way-to-override-concrete-backbone-methods/
 * https://github.com/mbostock/d3/wiki/Selections#animation--interaction
 *   The `this` context of an event callback in D3 is the DOM element.
 */

var app = new App({
  currentImage: new Image({
    name: "2008_000003",
    width: 500,
    height: 333,
    url: "../example-data/images/2008_000003.jpg",
    comment: ""
  })
});

var appPresenter = new AppPresenter(app);
var polyLine = new PolyLine({"id": app.get("currentImage").get("name")});

/*
* Create the drag behavior that lets us drag points around.
*/
var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dotDragStarted)
    .on("drag", dotDragged)
    .on("dragend", dotDragEnded);

var line = d3.select("#origin").selectAll("polyline")
  .data([{"width": 3, color: "#fff", opacity: 0.5, linecap: "round"},
         {"width": 1, color: "#000", opacity: 1, linecap: "butt"}])
  .enter()
  .append("polyline")
  .attr("fill", "none")
  .attr("points", "")
  .attr("vector-effect", "non-scaling-stroke")
  .attr("stroke", function(d) { return d.color; })
  .attr("stroke-width", function(d) { return d.width; })
  .attr("stroke-linecap", function(d) { return d.linecap; })
  .attr("stroke-linejoin", "round")
  .style("opacity", function(d) { return d.opacity; });
var dot = d3.select("#origin").append("g").attr("class", "dot");
updateDots();

function updateDots() {
  /*
   * <http://bost.ocks.org/mike/circles/>
   * <http://bost.ocks.org/mike/constancy/>
   */
  var dotsSelection = dot.selectAll("circle")
    .data(polyLine.get("points").models, function(d) { return d.id || d.cid; });
  dotsSelection.transition()
    .duration(500)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });
  dotsSelection.enter().append("circle")
    /* http://stackoverflow.com/questions/10473328/how-to-draw-non-scalable-circle-in-svg-with-javascript */
    .attr("vector-effect", "non-scaling-stroke")
    .attr("r", 5)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .style({"opacity": 0,
            "stroke-width": "1.5px",
            stroke: "#000",
            "stroke-opacity": 0.1,
            fill: "#fff",
            "fill-opacity": 0.1})
    .on("click", dotClick)
    .on("mouseover", function(d, i) {
      d3.select(this).transition().duration(250)
        .attr("r", 10)
        .style("opacity", 1)
        .style("fill-opacity", 0)
        .style("stroke", "#f00")
        .style("stroke-opacity", 1);
    })
    .on("mouseout", function(d, i) {
      d3.select(this).transition().duration(250)
        .attr("r", 5)
        .style("opacity", 1)
        .style("fill-opacity", 0.1)
        .style("stroke", "#000")
        .style("stroke-opacity", 0.1);
    })
    .call(drag)
    .transition()
    .duration(250)
    .style("opacity", 1);
  dotsSelection.exit()
    .on("click", null)
    .on("mouseover", null)
    .on("mouseout", null)
    .transition()
    .duration(250)
    .style("opacity", 0)
    .remove();
  updateLines();
}

function updateLines() {
  line.attr("points", polyLine.toSvgCoord());
}

function dotDragStarted(d, i) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dotDragged(d, i) {
  d.x = d3.event.x;
  d.y = d3.event.y;
  d3.select(this).attr("cx", d.x).attr("cy", d.y);
  updateLines();
}

function dotDragEnded(d, i) {
  console.log("dotDragEnded");
  console.log(d);
  console.log(i);
  d3.select(this).classed("dragging", false);
  updateLines();
}

function dotClick(d, i) {
  console.log("dotClick");
  console.log(d);
  console.log(i);
  /* <http://stackoverflow.com/questions/19075381/d3-mouse-events-click-dragend> */
  if (d3.event.defaultPrevented) return;
  if (d3.event.ctrlKey) {
    var points = polyLine.get("points");
    /* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift> */
    points.remove(d);
    updateDots();
  }
}

/* 
 * This function returns a two element array containing the "window" width and
 * height respectively.
 * <http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js>
 */
function getWindowSize() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0];
    return [w.innerWidth || e.clientWidth || g.clientWidth,
            w.innerHeight || e.clientHeight || g.clientHeight];
}

d3.select("#saveImageButton").on("click", function(d, i) {
  polyLine.save();
});

d3.select("#openImageButton").on("click", function(d, i) {
  polyLine.fetch({
    success: function(model, response, options) {
      console.log("fetch success");
      console.log(model);
      console.log(response);
    },
    error: function(model, response, options) {
      console.log("fetch fail");
    }
  });
  updateDots();
});
