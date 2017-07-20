'use strict'

const LRU = require('lru-cache')
const deepAssign = require('deep-assign')

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
    const cacheOptions = deepAssign({}, defaultOptions, options)
    _cache = LRU(cacheOptions)
  }
  return _cache
}
