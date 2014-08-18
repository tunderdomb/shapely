/**
 * Creates a type checker function
 * */
var type = module.exports = function ( name, options ){
  return function ( value ){
    return type[name](value, options)
  }
}

type.string = function ( value ){
  return typeof value == "string"
}

type.number = function ( value, options ){
  var valid = typeof value == "number" && value === value
  if ( valid ) {
    if ( options.inclusive || options.inclusive == undefined ) {
      if ( "max" in options ) valid = valid && value <= options.max
      if ( "min" in options ) valid = valid && value >= options.min
    }
    else {
      if ( "max" in options ) valid = valid && value < options.max
      if ( "min" in options ) valid = valid && value > options.min
    }
  }
  return valid
}

type.select = function( values, options ){
  var selections = options.select || []
  return values.some(function( value ){
    return !!~selections.indexOf(value)
  })
}

type["enum"] = function ( value, options ){
  return !!~(options.enum || []).indexOf(value)
}

type.email = function ( value ){
  return /^[^@]+@(([^@]+\.)+[^@]+)$/.test(value)
}