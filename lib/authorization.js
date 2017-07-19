'use strict'

const type = require('type-detect')
const _ = require('lodash')

module.exports = {
  determineAuthorization: function (combinedOptions, callbackObject) {
    let allowed = []
    let actual = []
    if (type(combinedOptions.roles) === 'Array') {
      allowed = combinedOptions.roles
    } else if (type(combinedOptions.roles) === 'string') {
      allowed.push(combinedOptions.roles)
    } else if (type(combinedOptions.roles) === 'function') {
      allowed = combinedOptions.roles(callbackObject)
    }
    if (type(callbackObject.roles) === 'Array') {
      actual = callbackObject.roles
    } else if (type(callbackObject.roles) === 'string') {
      actual.push(callbackObject.roles)
    } else if (type(callbackObject.roles) === 'function') {
      actual = callbackObject.roles(callbackObject)
    }
    if (combinedOptions.hierarchy) {
      let lowestAllowedIndex = 50
      let highestActualIndex = -1
      for (let actualRole of actual) {
        let i = combinedOptions.hierarchy.indexOf(actualRole)
        if (i >= 0 && i > highestActualIndex) {
          highestActualIndex = i
        }
      }
      for (let allowedRole of allowed) {
        let i = combinedOptions.hierarchy.indexOf(allowedRole)
        if (i >= 0 && i < lowestAllowedIndex) {
          lowestAllowedIndex = i
        }
      }
      return (highestActualIndex >= lowestAllowedIndex)
    }
    const intersection = _.intersection(allowed, actual)
    if (combinedOptions.all && intersection.length !== allowed.length) {
      return false
    }
    return (combinedOptions.any && intersection.length > 0)
  }
}
