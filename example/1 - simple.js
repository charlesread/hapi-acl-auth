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

!async function () {
  await server.register({
    plugin: require('hapi-acl-auth'),
    options: {
      handler: async function () {
        return {user: 'creaed', roles: ['admin']}
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
}()
  .then(function () {
    console.log('server started: %s', server.info.uri)
  })
  .catch(function (err) {
    console.error(err.message)
  })