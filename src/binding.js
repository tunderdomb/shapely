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