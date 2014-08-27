shapely
=======

Create shapely data models like a pro.

Shapely is a minimalistic data model library.
It runs both in the browser and in node.
This makes it perfect for node stacks.

# Why

Yeah why not? I needed a robust solution and folks just ain't provide what I needed so I wrote it.
Happens all the time.

# Fine show me your stuff

## Install

Nope, not yet. Like, you can `npm install <this-repo>`

But for the time being it's experimental and I'm not releasing it on npm.

## Use

### Describe your thing

```js
var thing = shapely(function init(a,b,c){})
thing.can("do", function something(a, b, c){})
thing.has("aField", { /* with buncha properties Imma tell you laters about */ })
```

### Instantiate the thing

```js
var realThing = thing(1,2,3)
realThing.do(1,2,3)
```

This looks simple, right? Well, what else do you want your data models to be capable of anyway?

## Ok, here are the guts (API)

### Definer aka `shapely(Function init)`

This will return a model describer that has two methods `.has()` and `.can()`.
The function you pass to it will be called each time you instantiate a thing with the arguments you pass in.

### has(String fieldName, Object options)

This defines a field on your model.
Shapely utilizes get-set functions instead of get and set methods.

This means you set field values by calling their function with an argument,
and get the value of them with calling the same function *without* any arguments:

```js
thing.has("name")
var aThing = thing()
aThing.name("John")
aThing.name() === "John"
```

#### options.validate(Function validate)

Define custom logic to validate this field.
Your function will receive the current field value as the only argument,
and should return a boolean indicating whether the value is valid or not.

```js
thing.has("field", {
  validate: function( value ){
    return true
  }
})
```

#### options.equals
#### options.type
#### options.default
#### options.required
#### options.get
#### options.set


## Constructor aka `thing(Mixed...)`

The model you instantiate already has some built in methods on its prototype.
Not much, but since you can extend it with `can()` I didn't feel the need
to bloat the proto with helpers, and stuff.

The values you pass to the model constructor
will be used to call the model's init function with.

### undefinedValue

This value will be the default default value for a field.
It is initially `undefined`.

### validate()

Validate the model.

### invalid()

Returns an array with invalid field names.

### error()

Get or set an error field on the model instance.
If called without any arguments, it returns the internal error hash.

### every()

Same logic as Array.prototype.every but iterates over field values.

### some()

Same logic as Array.prototype.some but iterates over field values.

### foreEach()

Iterate over field values.

### equals()

Check if another model equals this one.

### isSameModel()

Check if an object is of the kind of this one.

### isModelledFrom()

Check if some model matches this one.

### toArray()

Returns the values on the model in an array.

### toJSON()

Returns a json representation of the model.

### toString()

You can override this but by default it returns `"[Object Model]"`.

### select()

Select some values from the model.

### bind()

Bind an input field from the DOM to a field on the model.

### fromJSON()

Restore an instance from a json string or object.

### reset()

Sets every field to its default value.
This is called on every instantiation.

### getValue()

This just returns 0 by default.

TODO: Oh god writing documentation is such a pain. I'll finish this later.