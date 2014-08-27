var shapely = require("./model")
module.exports = shapely
if ( typeof window != "undefined" && global === window ) {
  global.shapely = shapely
}