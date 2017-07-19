'use strict'

const assert = require('assert')
const path = require('path')
const type = require('type-detect')

const authorization = require(path.join(__dirname, '..', 'lib', 'authorization.js'))

const routeOptions = {}
const callbackObject = {}

describe('authorization.js', function () {
  describe('#determineAuthorization()', function () {
    describe('any: true', function () {
      it('should return true if several roles are allowed and user has one', function () {
        routeOptions.any = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.any = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['bat']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
    describe('all: false', function () {
      it('should return true if several roles are allowed and user has one', function () {
        routeOptions.all = false
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.all = false
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['bat']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
    describe('all: true', function () {
      it('should return true if several roles are allowed and user all', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo', 'bar', 'baz']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = []
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has only one', function () {
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
    describe('all: true, any: true, all should take precedence', function () {
      it('should return true if several roles are allowed and user all', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo', 'bar', 'baz']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has none', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = []
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false if several roles are allowed and user has only one', function () {
        routeOptions.any = true
        routeOptions.all = true
        routeOptions.roles = ['foo', 'bar', 'baz']
        callbackObject.roles = ['foo']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
    describe('hierarchy', function () {
      it('should return true when actual role is more privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'user']
        callbackObject.roles = ['admin']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return true when actual role is equal to an allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['admin']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return true when actual roles are more privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['reporter', 'user']
        callbackObject.roles = ['admin', 'superuser']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false when actual role is less privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['user']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('should return false when actual roles are less privileged than least privileged allowed role', function () {
        routeOptions.hierarchy = ['reporter', 'user', 'admin', 'superuser']
        routeOptions.roles = ['superuser', 'admin']
        callbackObject.roles = ['user', 'reporter']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
    describe('roles as function', function () {
      it('plugin/route roles is function, callback roles is array, user has access', function () {
        routeOptions.roles = function (cbo) {
          assert(cbo)
          return ['reporter', 'user', 'admin', 'superuser']
        }
        callbackObject.roles = ['user']
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('plugin/route roles is array, callback roles is function, user has access', function () {
        routeOptions.roles = ['reporter', 'user', 'admin', 'superuser']
        callbackObject.roles = function (cbo) {
          assert(cbo)
          return ['user']
        }
        assert.equal(true, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('plugin/route roles is function, callback roles is array, user does not have access', function () {
        routeOptions.roles = function (cbo) {
          assert(cbo)
          return ['admin', 'superuser']
        }
        callbackObject.roles = ['user']
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
      it('plugin/route roles is array, callback roles is function, user does not have access', function () {
        routeOptions.roles = ['admin', 'superuser']
        callbackObject.roles = function (cbo) {
          assert(cbo)
          return ['user']
        }
        assert.equal(false, authorization.determineAuthorization(routeOptions, callbackObject))
      })
    })
  })
})
