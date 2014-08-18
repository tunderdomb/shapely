var shapely = require("./model")
module.exports = shapely
if ( global === window ) {
  global.shapely = shapely
}