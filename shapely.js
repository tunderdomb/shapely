(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @return Binding
 * */
module.exports = function( model, field, element, getSet ){
  return new Binding(model, field, element, getSet)
}

function normalizeValue( value ){
  switch ( true ) {
    case value == "true":
    case value == "false":
      return Boolean(value)
    case /^(\d*[\.,])?\d+?$/.test(value):
      return parseFloat(value)
    default:
      return value
  }
}

function isInput( element ){
  return element.tagName == "INPUT"
}

function isSelect( element ){
  return element.tagName == "SELECT"
}

/**
 * If the select allows multiple selections, returns an array of option values
 * otherwise a singe selected option value
 * @return String|String[]
 * */
function getSelectOption( select ){
  if ( select.multiple ) {
    return [].slice.call(select.selectedOptions).map(function( option ){
      return normalizeValue(option.value)
    })
  }
  else {
    return ~select.selectedIndex
      ? select.options[select.selectedIndex].value
      : null
  }
}
function getOptionByValue( select, optionValue ){
  var i = -1
    , l = select.length
    , options = select.options
  while ( ++i < l ) {
    if( options[i].value == optionValue ) return options[i]
  }
}
/**
 * If the select element allows multiple selections,
 * it accepts an string array of option values to set
 * otherwise it accepts a singe string for an option value
 * @param select{HTMLSelectElement}
 * @param selectedValues{String|String[]}
 * */
function setSelectOption( select, selectedValues ){
  if ( select.multiple ) {
    selectedValues.forEach(function( value ){
      getOptionByValue(select, value).selected = true
    })
  }
  else {
    getOptionByValue(select, selectedValues).selected = true
  }
}

function isCheckboxOrRadio( element ){
  return element.type == "checkbox" || element.type == "radio"
}

function Binding( model, field, element, getSet ){
  var binding = this
  binding.model = model
  binding.field = field
  binding.element = element

  // whether or not to use a custom element getter-setter
  this.getSet = getSet || this.getSet

  // listening to data changes
  model.listen("change:" + field, function (  ){
    binding.syncElement()
  })

  // registering events to listen on element changes
  function syncData( e ){
    binding.syncModel()
  }
  element.addEventListener("change", syncData, false)
  element.addEventListener("blur", syncData, false)
  element.addEventListener("keyup", syncData, false)
}
Binding.prototype = {
  // events triggered back and forth
  // this prevents them going in circles
  direction: 0,
  /**
   * Updates the element with the value from the data model
   * */
  syncElement: function (  ){
    if ( this.direction == 1 ) return
    this.direction = -1
    this.getSet(this.element, this.model[this.field]())
    this.direction = 0
  },
  /**
   * Updates the data model with the element's attribute value
   * */
  syncModel: function (  ){
    if ( this.direction == -1 ) return
    this.direction = 1
    this.model[this.field](this.getSet(this.element))
    this.direction = 0
  },
  /**
   * Default method to get and set the element's value
   * */
  getSet: function ( element, value ){
    if ( value === undefined ) {
      // get value
      if( isInput(element) && isCheckboxOrRadio(element) ) {
        return element.checked
      }
      else if ( isSelect(element) ) {
        return getSelectOption(element)
      }
      return normalizeValue(element.value)
    }
    else {
      // set value
      if( isInput(element) && isCheckboxOrRadio(element) ) {
        element.checked = !!value
      }
      else if ( isSelect(element) ) {
        setSelectOption(element, value)
      }
      element.value = value
    }
  }
}
},{}],2:[function(require,module,exports){
(function (global){
var shapely = require("./model")
module.exports = shapely
if ( typeof window != "undefined" && global === window ) {
  global.shapely = shapely
}
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./model":3}],3:[function(require,module,exports){
var noop = require("./util/noop")
var extend = require("./util/extend")
var type = require("./type")
var Radio = require("./radio")
var bind = require("./binding")

module.exports = model

function model( init ){
  init = init || noop
  var fields = []

  function Model( args ){
    this._values = {}
    this._errors = {}
    this.reset()
    init.apply(this, args)
  }

  // TODO: lock prototype
  Model.prototype = {
    constructor: Model,
    fields: fields,
    undefinedValue: undefined,

    // validation

    validate: function (){
      this._errors = {}
      return fields.every(function ( name ){
        var field = this[name]
        var value = this[name]()
        if ( field.required && (value == undefined || value == "") ) {
          return false
        }
        if ( field.type && !field.type(value) ) {
          return false
        }
        return !(field.validate && !field.validate.call(this, value))
      }, this)
    },
    invalid: function (){
      return fields.filter(function ( name ){
        var field = this[name]
        var value = this[name]()
        if ( field.required && (value == undefined || value == "") ) {
          return true
        }
        if ( field.type && !field.type(value) ) {
          return true
        }
        return field.validate && !field.validate.call(this, value)
      }, this)
    },
    error: function( fieldName, errorValue ){
      if ( errorValue == undefined ) return this._errors[fieldName]
      else if( fieldName == undefined ) return this._errors
      else this._errors[fieldName] = errorValue
    },

    // iterators

    every: function ( f, ctx ){
      ctx = ctx || this
      return fields.every(function ( name ){
        return f.call(ctx, this[name](), name)
      }, this)
    },
    some: function ( f, ctx ){
      ctx = ctx || this
      return fields.some(function ( name ){
        return f.call(ctx, this[name](), name)
      }, this)
    },
    foreEach: function ( f, ctx ){
      ctx = ctx || this
      fields.foreEach(function ( name ){
        f.call(ctx, this[name](), name)
      }, this)
    },
    equals: function ( other, strict ){
      strict = strict == undefined || strict
      // fields count mismatch
      return other.fields.length == this.fields.length && fields.every(function ( name ){
        // field name mismatch
        return !!~other.fields.indexOf(name)
          // custom equality
          && this[name].equals
          ? this[name].equals.call(this, this[name](), other[name]())
          : strict
          // strict equality
          ? this[name]() === other[name]()
          // allow coercing
          : this[name]() == other[name]()
      }, this)
    },

    // type and instance checkers

    isSameModel: function ( other ){
      return Model === other.constructor
    },
    isModelledFrom: function ( model ){
      return model === create
    },

    // conversion

    toArray: function (){
      var arr = []
      fields.forEach(function ( name ){
        arr.push(this[name]())
      }, this)
      return arr
    },
    /**
     * Returns a pure object representation of the model
     * NOTE: if a value is not set (undefined) it is not included in the object
     * unless you set the `undefinedValue` something other than `undefined`
     * */
    toJSON: function (){
      var model = this
      return fields.reduce(function ( obj, name ){
        obj[name] = model[name]()
        return obj
      }, {})
    },
    toString: function (){
      return "[Object Model]"
    },
    select: function( fields ){
      var model = this
      return fields.reduce(function( obj, name ){
        obj[name] = model[name]()
        return obj
      }, {})
    },

    // create a two way binding
    bind: function( field, element, getSet ){
      return bind(this, field, element, getSet)
    },

    // state management

    /**
     * Restore a model state from a JSON object or JSON string
     * this does not trigger events
     * */
    fromJSON: function ( json ){
      if ( typeof json == "string" ) json = JSON.parse(json)
      for ( var name in json ) {
        if ( json.hasOwnProperty(name) ) this[name](json[name], true)
      }
      return this
    },
    reset: function (){
      fields.forEach(function ( name ){
        this[name](this[name].default, true)
      }, this)
      return this
    },
    getValue: function (){
      return 0
    }
  }

  function create(){
    return new Model(arguments)
  }

  create.has = function ( name, setup ){
    if ( name in Model.prototype ) throw new Error("'" + name + "' already exists in model")
    setup = setup || {}

    // field props and methods
    field.validate = setup.validate || function( value ){
      return !(field.required && (value == undefined || value == ""))
    }
    if ( "equals" in setup ) field.equals = setup.equals
    if ( "type" in setup ) field.type = type(setup.type, setup)
    if ( "default" in setup ) field.default = setup.default
    field.required = setup.required

    // adding to field list
    fields.push(name)

    // get set shortcuts
    var getValue = setup.get
      , setValue = setup.set

    // prototype method
    function field( val, restore ){
      if ( val === undefined ) {
        val = name in this._values  // value is explicitly set ?
          ? this._values[name]      // yes, use that
          : "default" in field      // no, so is there a default field value ?
          ? field.default           // yes, use that
          : this.undefinedValue     // no, use the default undefined value
        // transform the value or use it simply
        val = getValue ? getValue(val) : val
      }
      else {
        // set
        var oldValue = this._values[name]
        val = this._values[name] = setValue && !restore ? setValue.call(this, val) : val
        if( !restore ) {
          this.broadcast("change", name, oldValue, val)
          this.broadcast("change:"+name, oldValue, val)
        }
      }
      return val
    }

    Model.prototype[name] = field
    return create
  }

  create.can = function ( name, body ){
    if ( typeof name == "string" && typeof body == "function" ) {
      Model.prototype[name] = body
    }
    else if ( !body ) {
      extend(Model.prototype, name)
    }
    return create
  }

  create.prototype = Model.prototype
  extend(Model.prototype, Radio.prototype)

  return create
}
},{"./binding":1,"./radio":4,"./type":5,"./util/extend":6,"./util/noop":7}],4:[function(require,module,exports){
module.exports = Radio

function Radio(){}

var proto = Radio.prototype = {}
proto.listen = listen
proto.unListen = unListen
proto.broadcast = broadcast
proto.listenOnce = once
proto.hasListener = hasListener

function listen( channel, listener ){
  this.channels = this.channels || {}
  channel = this.channels[channel] || (this.channels[channel] = [])
  channel.push(listener)
  return this
}

function unListen( channel, listener ){
  if( !this.channels ) return this
  // remove all channels
  if ( !channel ) {
    this.channels = {}
  }
  // reset a channel
  else if ( !listener ) {
    this.channels[channel] = []
  }
  // remove a listener
  else {
    channel = this.channels[channel]
    if ( channel ) {
      var i = channel.indexOf(listener)
      if ( ~i ) {
        channel.splice(i, 1)
      }
    }
  }
  return this
}

function broadcast( channel, message ){
  if( !this.channels ) return this
  channel = this.channels[channel]
  if( !channel ) return this
  message = [].slice.call(arguments, 1)
  channel.forEach(function ( listener ){
    listener.apply(this, message)
  }, this)
  return this
}

function once( channel, listener ){
  function proxy(){
    unListen.call(this, channel, proxy)
    listener.apply(this, arguments)
  }
  listen.call(this, channel, proxy)
  return this
}

function hasListener( channel, listener ){
  if( !this.channels ) return false
  channel = this.channels[channel]
  return channel && listener && !!~channel.indexOf(listener)
}

},{}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
module.exports = function extend( obj, extension ){
  for ( var prop in extension ) {
    if( extension.hasOwnProperty(prop) ) obj[prop] = extension[prop]
  }
  return obj
}
},{}],7:[function(require,module,exports){
module.exports = function noop(  ){}
},{}]},{},[2])