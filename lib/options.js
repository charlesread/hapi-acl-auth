'use strict'

const util = require('util')
const deepExtend = require('deep-extend')
const joi = require('joi')
const debug = require('debug')('hapi-acl-auth:options')

const pluginDefaults = {
  any: true,
  all: false,
  policy: 'deny',
  secure: true
}

const optionsSchema = joi.object().keys({
  handler: joi.func().required(),
  roles: joi.alternatives().try(joi.array(), joi.func()),
  any: joi.boolean().required(),
  all: joi.boolean().required(),
  forbiddenPageFunction: joi.func().optional(),
  hierarchy: joi.array().items(joi.string()).optional(),
  secure: joi.boolean().required(),
  policy: joi.string().valid('allow', 'deny').required(),
  cache: joi.boolean().optional(),
  allowUnauthenticated: joi.boolean().optional(),
  exempt: joi.array().optional()
})

module.exports = function (req, options) {
  const routeOptions = req.route.settings.plugins['hapi-acl-auth'] || req.route.settings.plugins['hapiAclAuth'] || {}
  const pluginOptions = deepExtend({}, pluginDefaults, options)
  const combinedOptions = deepExtend({}, pluginOptions, routeOptions)
  debug('routeOptions:')
  debug(routeOptions)
  debug('pluginOptions:')
  debug(pluginOptions)
  debug('combinedOptions:')
  debug(combinedOptions)
  const _options = joi.validate(combinedOptions, optionsSchema)
  if (_options.error) {
    throw new Error(util.format('options could not be validated: %s', _options.error.message))
  }
  return {routeOptions, pluginOptions, combinedOptions}
}
