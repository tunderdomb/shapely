var assert = require('chai').assert
var shapely = require("../src/index")

var thing = shapely()
var aThing = thing()
var anotherThing = thing()

var simpleThing = shapely()
var sSimpleThing = simpleThing()
var anotherSimpleThing = simpleThing()

var extraThing = shapely()
var anExtraThing = extraThing()
var anotherExtraThing = extraThing()

describe("shapely", function(  ){

  describe("thing", function(  ){
    it("should be awesome", function(  ){

    })
  })

  describe("simple thing", function(  ){
    it("should be awesome", function(  ){

    })
  })

  describe("extra thing", function(  ){
    it("should be awesome", function(  ){

    })
  })

})