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
      const {routeOptions, pluginOptions, combinedOptions} = options(req, opts)
      if ((pluginOptions.policy === 'deny' && combinedOptions.secure) || (pluginOptions.policy === 'allow' && routeOptions.secure)) {
        debug('policy if statement has evaluated to true')
        const handlerResult = combinedOptions.handler(req)
        const handlerObject = handlerResult.then ? await handlerResult : handlerResult
        debug('handlerObject:')
        debug(handlerObject)
        const isAuthorized = await authorization.determineAuthorization(combinedOptions, handlerObject, req)
        debug('isAuthorized: %s', isAuthorized)
        if (!isAuthorized) {
          const forbiddenResult = combinedOptions.forbiddenPageFunction ? combinedOptions.forbiddenPageFunction(handlerObject, req, h) : Boom.forbidden()
          result = forbiddenResult && forbiddenResult.then ? await forbiddenResult : forbiddenResult
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
    debug('result:')
    debug(result)
    return result
  })
}

plugin.pkg = pjson

module.exports = plugin
