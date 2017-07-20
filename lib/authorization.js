'use strict'

const path = require('path')

const type = require('type-detect')
const _ = require('lodash')

const cache = require(path.join(__dirname, 'cache.js'))()

module.exports = {
  determineAuthorization: function (combinedOptions, callbackObject, req) {
    let allowed = []
    let actual = []
    const cachedData = cache.get(req.path)
    if (cachedData && combinedOptions.cache) {
      allowed = cachedData.allowed
      actual = cachedData.actual
    } else {
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
      if (combinedOptions.cache) {
        cache.set(req.path, {allowed, actual})
      }
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
