'use strict'

/*

 Example using a hierarchy of roles.

 Policy is `deny`, by default.
 User has one role ('admin').
 User does not explicitly have the role 'user', but because the hierarchy places 'admin' as higher privilege
  than 'user' the user will be authorized for /user
 User has role required by /admin.
 User does not have role required by /superuser.
 Endpoint /notsecure has secure: false, thus overriding the default deny policy.

 */

const Hapi = require('hapi')

const server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 8000
})

const plugins = [
  {
    register: require('../index'),
    options: {
      handler: function (request, callback) {
        callback(null, {username: 'cread', roles: ['admin']})
      },
      hierarchy: ['user', 'admin', 'superuser']
    }
  }
]

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }

    // should return 200
    server.route({
      method: 'GET',
      path: '/user',
      handler: function (request, reply) {
        return reply('user')
      },
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['user']
          }
        }
      }
    })

    // should return 200
    server.route({
      method: 'GET',
      path: '/admin',
      handler: function (request, reply) {
        return reply('admin')
      },
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['admin']
          }
        }
      }
    })

    // should return 403
    server.route({
      method: 'GET',
      path: '/superuser',
      handler: function (request, reply) {
        return reply('superuser')
      },
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['superuser']
          }
        }
      }
    })

    // should return 200
    server.route({
      method: 'GET',
      path: '/notsecure',
      config: {
        plugins: {
          hapiAclAuth: {
            secure: false
          }
        }
      },
      handler: function (request, reply) {
        return reply('notsecure')
      }
    })
  })

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
