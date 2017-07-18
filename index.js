'use strict'

const pjson = require('./package.json')

const fs = require('fs')
const path = require('path')
const deepAssign = require('deep-assign')

const authorization = require(path.join(__dirname, 'lib', 'authorization.js'))

const pluginDefaults = {
  forbiddenPagePath: path.join(__dirname, 'static', '403.html'),
  any: true,
  all: false
}

function plugin (server, options, next) {
  server.ext('onPreHandler', function (req, reply) {
    const routeOptions = req.route.settings.plugins['hapi-acl-auth'] || req.route.settings.plugins['hapiAclAuth']
    const pluginOptions = deepAssign({}, pluginDefaults, options)
    const combinedOptions = deepAssign({}, pluginOptions, routeOptions)
    console.log(combinedOptions)
    if (routeOptions && routeOptions.roles) {
      combinedOptions.handler(req, function (err, callbackObject) {
        if (err) {
          throw err
        }
        const isAuthorized = authorization.determineAuthorization(combinedOptions, callbackObject)
        if (!isAuthorized) {
          reply(fs.createReadStream(combinedOptions.forbiddenPagePath)).code(403)
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
