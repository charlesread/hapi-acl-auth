'use strict'

const path = require('path')
const chai = require('chai')
chai.should()

let cache

describe('cache.js', function () {
  beforeEach(function () {
    cache = require(path.join(__dirname, '..', 'lib', 'cache.js'))()
  })
  afterEach(function () {
    cache.reset()
    cache = undefined
  })
  it('cache should initialize', function () {
    cache.should.not.be.null
  })
  it('cache should store value', function () {
    cache.set('foo', 'bar')
    cache.get('foo').should.equal('bar')
  })
})
