'use strict'

const pjson = require('./package.json')

const path = require('path')
const Boom = require('boom')
const debug = require('debug')('hapi-acl-auth:plugin')

const options = require(path.join(__dirname, 'lib', 'options.js'))
const authorization = require(path.join(__dirname, 'lib', 'authorization.js'))

function plugin (server, opts, next) {
  debug('opts:')
  debug(opts)
  server.ext('onPreResponse', function (req, reply) {
    if (opts.requireAuthentication === false && req.auth.isAuthenticated === false) {
      return reply.continue()
    }
    debug('request for %s caught', req.path)
    debug('req.auth.credentials:')
    debug(req.auth.credentials)
    const {routeOptions, pluginOptions, combinedOptions} = options(req, opts)
    if ((pluginOptions.policy === 'deny' && combinedOptions.secure) || (pluginOptions.policy === 'allow' && routeOptions.secure)) {
      combinedOptions.handler(req, function (err, callbackObject) {
        debug('callbackObject:')
        debug(callbackObject)
        if (err) {
          throw err
        }
        authorization.determineAuthorization(combinedOptions, callbackObject, req)
          .then((isAuthorized) => {
            debug('isAuthorized: %s', isAuthorized)
            if (!isAuthorized) {
              reply(combinedOptions.forbiddenPageFunction ? combinedOptions.forbiddenPageFunction(callbackObject) : Boom.forbidden())
            } else {
              reply.continue()
            }
          })
      })
    } else {
      reply.continue()
    }
  })

  return next()
}

plugin.attributes = {
  name: 'hapi-auth-auth',
  version: pjson.version
}

module.exports = plugin
