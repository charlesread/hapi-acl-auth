'use strict'

/*

 Simple example.

 Policy is `deny`, by default.
 User has one role ('admin').
 User has role required by /admin.
 User does not have role required by /superuser.
 Endpoint /notsecure has secure: false, thus overriding the default deny policy.

 */

const Hapi = require('hapi')

const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

;(async function () {
  await server.register({
    plugin: require('hapi-acl-auth'),
    options: {
      handler: async function () {
        return {user: 'cread', roles: ['admin']}
      },
      // optional, dy default a simple 403 will be returned when not authorized
      forbiddenPageFunction: async function (credentials, request, h) {
        // some fancy "logging"
        console.log('%s (roles: %s) wanted %s (requires %s) but was not allowed', credentials.user, credentials.roles, request.path, request.route.settings.plugins['hapiAclAuth'].roles)
        // some fancy error page
        const response = h.response('<h1>Not Authorized!</h1>')
        response.code(200)
        return response.takeover()
      }
    }
  })
  server.route({
    method: 'get',
    path: '/admin',
    handler: async function (request, h) {
      return '<h1>Welcome to /admin!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          roles: ['admin']
        }
      }
    }
  })
  server.route({
    method: 'get',
    path: '/superuser',
    handler: async function (request, h) {
      return '<h1>Welcome to /superuser!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          roles: ['superuser']
        }
      }
    }
  })
  server.route({
    method: 'get',
    path: '/notsecure',
    handler: async function (request, h) {
      return '<h1>Welcome to /notsecure!</h1>'
    },
    config: {
      plugins: {
        hapiAclAuth: {
          secure: false
        }
      }
    }
  })
  await server.start()
})()
  .then(function () {
    console.log('server started: %s', server.info.uri)
  })
  .catch(function (err) {
    console.error(err.message)
  })
