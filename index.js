'use strict'

const pjson = require('./package.json')

const fs = require('fs')
const path = require('path')
const deepAssign = require('deep-assign')
const dotProp = require('dot-prop')

const pluginDefaults = {
  logoutPath: '/login',
  secure: true,
  usernameLocation: 'session.username',
  rolesLocation: 'session.roles'
}

function plugin (server, options, next) {

  const pluginOptions = deepAssign({}, pluginDefaults, options)
  const routeDefaults = {
    secure: pluginOptions.secure,
    handler: pluginOptions.handler
  }

  server.ext('onPreHandler', function (req, reply) {
    const routeOptions = deepAssign({}, routeDefaults, req.route.settings.plugins['hapi-acl-auth'] || req.route.settings.plugins['hapiAclAuth'] || {})
    if (!req.session) {
      throw new Error('No session plugin was found.')
    }
    if (routeOptions.secure) {
      return reply().redirect(loginPath)
    }
    reply.continue()
  })

  server.route({
    method: 'get',
    path: pluginOptions.logoutPath,
    handler: function (req, reply) {
      req.session = {}
      return reply('ok')
    }
  })

  return next()
}

plugin.attributes = {
  name: 'hapi-auth-auth',
  version: pjson.version
}

module.exports = plugin