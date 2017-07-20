'use strict'

const pjson = require('./package.json')

const path = require('path')
const Boom = require('boom')

const options = require(path.join(__dirname, 'lib', 'options.js'))
const authorization = require(path.join(__dirname, 'lib', 'authorization.js'))

function plugin (server, opts, next) {
  server.ext('onPreHandler', function (req, reply) {
    const {routeOptions, pluginOptions, combinedOptions} = options(req, opts)
    if ((pluginOptions.policy === 'deny' && combinedOptions.secure) || (pluginOptions.policy === 'allow' && routeOptions.secure)) {
      combinedOptions.handler(req, function (err, callbackObject) {
        if (err) {
          throw err
        }
        const isAuthorized = authorization.determineAuthorization(combinedOptions, callbackObject, req)
        if (!isAuthorized) {
          reply(combinedOptions.forbiddenPageFunction ? combinedOptions.forbiddenPageFunction(callbackObject) : Boom.forbidden())
        } else {
          reply.continue()
        }
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
