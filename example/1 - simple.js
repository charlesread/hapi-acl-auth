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

const server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 8000
})

const plugins = [
  {
    plugin: require('../index'),
    options: {
      handler: async function (request) {
        return {username: 'cread', roles: ['admin']}
      }
    }
  }
]

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }

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
