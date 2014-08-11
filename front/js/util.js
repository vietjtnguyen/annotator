// This function returns a two element array containing the "window" width and
// height respectively.
// <http://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js>
function getWindowSize() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0];
    return [w.innerWidth || e.clientWidth || g.clientWidth,
            w.innerHeight || e.clientHeight || g.clientHeight];
};

// Generate a pseudo-GUID by concatenating random hexadecimal. Taken from
// `backbone.localStorage.js`.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};
