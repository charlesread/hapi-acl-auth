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
  server.ext('onPostAuth', function (req, reply) {
    debug('request for %s caught', req.path)
    if (opts.exempt && opts.exempt.includes(req.path)) {
      debug('%s is exempt', req.path)
      return reply.continue()
    } else {
      debug('%s is not exempt', req.path)
    }
    if (opts.allowUnauthenticated && !req.auth.isAuthenticated) {
      return reply.continue()
    }
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
              const result = combinedOptions.forbiddenPageFunction ? combinedOptions.forbiddenPageFunction(callbackObject, req, reply) : Boom.forbidden()
              if (!combinedOptions.forbiddenPageFunction || (combinedOptions.forbiddenPageFunction && combinedOptions.forbiddenPageFunction.length === 1)) {
                reply(result)
              }
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
