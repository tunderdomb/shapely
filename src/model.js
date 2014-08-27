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