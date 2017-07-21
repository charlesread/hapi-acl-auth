'use strict'

const assert = require('assert')
const path = require('path')
const type = require('type-detect')

const cache = require(path.join(__dirname, '..', 'lib', 'cache.js'))()
const authorization = require(path.join(__dirname, '..', 'lib', 'authorization.js'))

const routeOptions = {}
const callbackObject = {}
const req = {path: '/'}

describe('authorization.js', function () {
  afterEach(function () {
    cache.reset()
  })
  describe('#determineAuthorization()', function () {
    describe('any: true', function () {
      it('should return true if several roles are allowed and user has one', function () {
        routeOptions.any = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.any = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['bat']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
    })
    describe('all: false', function () {
      beforeEach(function () {
        cache.reset()
      })
      afterEach(function () {
        cache.reset()
      })
      it('should return true if several roles are allowed and user has one', function () {
        routeOptions.all = false
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.all = false
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['bat']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
    })
    describe('all: true', function () {
      it('should return true if several roles are allowed and user all', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo', 'bar', 'baz']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = []
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
      it('should return false if several roles are allowed and user has only one', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
    })
    describe('all: true, any: true, all should take precedence', function () {
      it('should return true if several roles are allowed and user all', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo', 'bar', 'baz']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = []
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
      it('should return false if several roles are allowed and user has only one', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
    })
    describe('hierarchy', function () {
      it('should return true when actual role is more privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'user']
        callbackObject.roles = ['admin']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return true when actual role is equal to an allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['admin']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return true when actual roles are more privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['reporter', 'user']
        callbackObject.roles = ['admin', 'superuser']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('should return false when actual role is less privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['user']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
      it('should return false when actual roles are less privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['user', 'reporter']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
    })
    describe('roles as function', function () {
      it('plugin/route roles is function, callback roles is array, user has access', function () {
        routeOptions.roles = function (cbo) {
          assert(cbo)
          return ['reporter', 'user', 'admin', 'superuser']
        }
        callbackObject.roles = ['user']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('plugin/route roles is array, callback roles is function, user has access', function () {
        routeOptions.roles = ['reporter', 'user', 'admin', 'superuser']
        callbackObject.roles = function (cbo) {
          assert(cbo)
          return ['user']
        }
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(true, v)
          })
      })
      it('plugin/route roles is function, callback roles is array, user does not have access', function () {
        routeOptions.roles = function (cbo) {
          assert(cbo)
          return ['admin', 'superuser']
        }
        callbackObject.roles = ['user']
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
      it('plugin/route roles is array, callback roles is function, user does not have access', function () {
        routeOptions.roles = ['admin', 'superuser']
        callbackObject.roles = function (cbo) {
          assert(cbo)
          return ['user']
        }
        authorization.determineAuthorization(routeOptions, callbackObject, req)
          .then((v) => {
            assert.equal(false, v)
          })
      })
      describe('roles functions return a promise', function () {
        it('should work when combinedOptions roles function returns promise', function (done) {
          routeOptions.roles = function (cbo) {
            assert(cbo)
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(['user'])
              }, 1000)
            })
          }
          callbackObject.roles = function (cbo) {
            assert(cbo)
            return ['user']
          }
          authorization.determineAuthorization(routeOptions, callbackObject, req)
            .then((v) => {
              assert.equal(true, v)
              done()
            })
        })
        it('should work when callbackObject roles function returns promise', function (done) {
          routeOptions.roles = function (cbo) {
            assert(cbo)
            return ['user']
          }
          callbackObject.roles = function (cbo) {
            assert(cbo)
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(['user'])
              }, 500)
            })
          }
          authorization.determineAuthorization(routeOptions, callbackObject, req)
            .then((v) => {
              assert.equal(true, v)
              done()
            })
        })
        it('should work when both roles functions return promises', function (done) {
          routeOptions.roles = function (cbo) {
            assert(cbo)
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(['user'])
              }, 500)
            })
          }
          callbackObject.roles = function (cbo) {
            assert(cbo)
            return new Promise((resolve) => {
              setTimeout(function () {
                resolve(['user'])
              }, 500)
            })
          }
          authorization.determineAuthorization(routeOptions, callbackObject, req)
            .then((v) => {
              assert.equal(true, v)
              done()
            })
        })
      })
    })
  })
})
