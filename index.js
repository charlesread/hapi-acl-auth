'use strict'

const pjson = require('./package.json')

const fs = require('fs')
const path = require('path')
const util = require('util')
const deepAssign = require('deep-assign')
const Boom = require('boom')
const Joi = require('joi')
const authorization = require(path.join(__dirname, 'lib', 'authorization.js'))

const pluginDefaults = {
  any: true,
  all: false,
  policy: 'deny',
  secure: true
}

const optionsSchema = Joi.object().keys({
  handler: Joi.func().required(),
  roles: Joi.array().required(),
  any: Joi.boolean().required(),
  all: Joi.boolean().required(),
  forbiddenPageFunction: Joi.func().optional(),
  hierarchy: Joi.array().items(Joi.string()).optional(),
  secure: Joi.boolean().required(),
  policy: Joi.string().valid('allow', 'deny').required()
})

function plugin (server, options, next) {
  server.ext('onPreHandler', function (req, reply) {
    const routeOptions = req.route.settings.plugins['hapi-acl-auth'] || req.route.settings.plugins['hapiAclAuth'] || {}
    const pluginOptions = deepAssign({}, pluginDefaults, options)
    const combinedOptions = deepAssign({}, pluginOptions, routeOptions)
    const _options = Joi.validate(combinedOptions, optionsSchema)
    if (_options.error) {
      throw new Error(util.format('Options could not be validated: %s', _options.error.message))
    }
    if ((pluginOptions.policy === 'deny' && combinedOptions.secure) || (pluginOptions.policy === 'allow' && routeOptions.secure)) {
      combinedOptions.handler(req, function (err, callbackObject) {
        if (err) {
          throw err
        }
        const isAuthorized = authorization.determineAuthorization(combinedOptions, callbackObject)
        if (!isAuthorized) {
          reply(combinedOptions.forbiddenPageFunction(callbackObject) || Boom.forbidden()).code(403)
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
