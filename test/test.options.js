'use strict'

const chai = require('chai')

chai.should()

const path = require('path')

const options = require(path.join(__dirname, '..', 'lib', 'options.js'))

describe('options.js', function () {
  describe('Joi validation', function () {
    it('should throw when nothing is passed', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {
            'hapi-acl-auth': undefined
          }
        }
      }
      const pluginOptions = {}
      try {
        options(req, pluginOptions)
      } catch (err) {
        err.should.not.be.null
      }
    })
    it('should not throw when handler and roles are passed in route options', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {
            'hapi-acl-auth': {
              handler: function () {
              },
              roles: []
            }
          }
        }
      }
      const pluginOptions = {}
      try {
        options(req, pluginOptions)
      } catch (err) {
        err.should.be.null
      }
    })
    it('should not throw when handler and roles are passed in plugin options', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {}
        }
      }
      const pluginOptions = {
        handler: function () {
        },
        roles: []
      }
      try {
        options(req, pluginOptions)
      } catch (err) {
        err.should.be.null
      }
    })
    it('policy should be deny when not specified in plugin options', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {}
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: []
      }
      const {combinedOptions} = options(req, _pluginOptions)
      combinedOptions.policy.should.equal('deny')
    })
    it('secure should be false when overridden in route options', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {
            'hapiAclAuth': {
              secure: false
            }
          }
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: []
      }
      const {combinedOptions} = options(req, _pluginOptions)
      combinedOptions.secure.should.equal(false)
    })
  })
  describe('general functionality', function () {
    it('roles in combinedOptions should match route roles when overridden in route', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {
            'hapiAclAuth': {
              roles: ['a', 'b']
            }
          }
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: ['a']
      }
      const {combinedOptions} = options(req, _pluginOptions)
      req.route.settings.plugins['hapiAclAuth'].roles.should.eql(combinedOptions.roles)
    })
    it('roles in combinedOptions should match plugin roles not when overridden in route', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {}
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: ['a']
      }
      const {combinedOptions} = options(req, _pluginOptions)
      _pluginOptions.roles.should.eql(combinedOptions.roles)
    })
    it('roles in plugin options should be able to be a function', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {}
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: function () {
          return ['a']
        }
      }
      options(req, _pluginOptions)
    })
    it('roles in plugin options and route options should be able to be a function', function () {
      const req = {}
      req.route = {
        settings: {
          plugins: {
            hapiAclAuth: {
              roles: function () {
                return ['a']
              }
            }
          }
        }
      }
      const _pluginOptions = {
        handler: function () {
        },
        roles: function () {
          return ['a']
        }
      }
      options(req, _pluginOptions)
    })
  })
})
