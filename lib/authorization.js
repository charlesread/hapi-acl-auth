'use strict'

const path = require('path')
const co = require('bluebird-co').co
const type = require('type-detect')
const _ = require('lodash')
const debug = require('debug')('hapi-acl-auth:authorization')

const cache = require(path.join(__dirname, 'cache.js'))()

module.exports = {
  determineAuthorization: function (combinedOptions, callbackObject, req) {
    debug('combinedOptions:')
    debug(combinedOptions)
    debug('callbackObject:')
    debug(callbackObject)
    return co(function * () {
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
          const res = combinedOptions.roles(callbackObject)
          if (res.then) {
            allowed = yield res
          } else {
            allowed = res
          }
        }
        if (type(callbackObject.roles) === 'Array') {
          actual = callbackObject.roles
        } else if (type(callbackObject.roles) === 'string') {
          actual.push(callbackObject.roles)
        } else if (type(callbackObject.roles) === 'function') {
          const res = callbackObject.roles(callbackObject)
          if (res.then) {
            actual = yield res
          } else {
            actual = res
          }
        }
        if (combinedOptions.cache) {
          cache.set(req.path, {allowed, actual})
        }
      }
      debug('allowed:')
      debug(allowed)
      debug('actual:')
      debug(actual)
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
        debug('highestActualIndex: %s, lowestAllowedIndex: %s', highestActualIndex, lowestAllowedIndex)
        return (highestActualIndex >= lowestAllowedIndex)
      }
      const intersection = _.intersection(allowed, actual)
      debug('intersection: %j', intersection)
      if (combinedOptions.all && intersection.length !== allowed.length) {
        return false
      }
      return (combinedOptions.any && intersection.length > 0)
    })
  }
}
