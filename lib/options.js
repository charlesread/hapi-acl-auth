'use strict'

const util = require('util')
const deepAssign = require('deep-assign')
const joi = require('joi')

const pluginDefaults = {
  any: true,
  all: false,
  policy: 'deny',
  secure: true
}

const optionsSchema = joi.object().keys({
  handler: joi.func().required(),
  roles: joi.alternatives().try(joi.array(), joi.func()).required(),
  any: joi.boolean().required(),
  all: joi.boolean().required(),
  forbiddenPageFunction: joi.func().optional(),
  hierarchy: joi.array().items(joi.string()).optional(),
  secure: joi.boolean().required(),
  policy: joi.string().valid('allow', 'deny').required(),
  cache: joi.boolean().optional()
})

module.exports = function (req, options) {
  const routeOptions = req.route.settings.plugins['hapi-acl-auth'] || req.route.settings.plugins['hapiAclAuth'] || {}
  const pluginOptions = deepAssign({}, pluginDefaults, options)
  const combinedOptions = deepAssign({}, pluginOptions, routeOptions)
  const _options = joi.validate(combinedOptions, optionsSchema)
  if (_options.error) {
    throw new Error(util.format('options could not be validated: %s', _options.error.message))
  }
  return {routeOptions, pluginOptions, combinedOptions: _options.value}
}
