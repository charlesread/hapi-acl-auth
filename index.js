'use strict'

const pjson = require('./package.json')

const path = require('path')
const Boom = require('boom')
const debug = require('debug')('hapi-acl-auth:plugin')

const options = require(path.join(__dirname, 'lib', 'options.js'))
const authorization = require(path.join(__dirname, 'lib', 'authorization.js'))

const plugin = {}

plugin.register = async function (server, opts) {
  let result
  debug('opts:')
  debug(opts)
  server.ext('onPostAuth', async function (req, h) {
    try {
      debug('request for %s caught', req.path)
      if (opts.exempt && opts.exempt.includes(req.path)) {
        debug('%s is exempt', req.path)
        return h.continue
      } else {
        debug('%s is not exempt', req.path)
      }
      if (opts.allowUnauthenticated && !req.auth.isAuthenticated) {
        return h.continue
      }
      debug('req.auth.credentials:')
      debug(req.auth.credentials)
      const {routeOptions, pluginOptions, combinedOptions} = options(req, opts)
      if ((pluginOptions.policy === 'deny' && combinedOptions.secure) || (pluginOptions.policy === 'allow' && routeOptions.secure)) {
        debug('policy if statement has evaluated to true')
        const callbackObject = await combinedOptions.handler(req)//, function (err, callbackObject) {
        debug('callbackObject:')
        debug(callbackObject)
        const isAuthorized = await authorization.determineAuthorization(combinedOptions, callbackObject, req)
        debug('isAuthorized: %s', isAuthorized)
        if (!isAuthorized) {
          const forbiddenResult = combinedOptions.forbiddenPageFunction ? combinedOptions.forbiddenPageFunction(callbackObject, req, h) : Boom.forbidden()
          if (forbiddenResult && forbiddenResult.then) {
            result = await forbiddenResult
          } else {
            result = forbiddenResult
          }
        } else {
          result = h.continue
        }
      } else {
        debug('policy if statement has evaluated to false')
        result = h.continue
      }
    } catch (e) {
      throw e
    }
    return result
  })
}

plugin.pkg = pjson

module.exports = plugin
