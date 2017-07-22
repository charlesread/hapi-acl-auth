'use strict'

const LRU = require('lru-cache')
const deepExtend = require('deep-extend')
const debug = require('debug')('hapi-acl-auth:cache')

let _cache

const defaultOptions = {
  max: 500,
  length: function (n, key) {
    return n * 2 + key.length
  },
  maxAge: 1000 * 60 * 60
}

module.exports = function (options) {
  if (!_cache) {
    const cacheOptions = deepExtend({}, defaultOptions, options)
    debug('cacheOptions: ')
    debug(cacheOptions)
    _cache = LRU(cacheOptions)
  }
  return _cache
}
