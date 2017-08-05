'use strict'

/*

 Simple example using hapi-form-authentication for authentication.

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
    register: require('hapi-form-authentication'),
    options: {
      handler: function (username, password, callback) {
        // if the password is "password" let them in
        const isValid = password === 'password'
        // the callback takes two parameters; the first is a simple Boolean
        // that indicates whether or not the user is valid, the second is an
        // object that must contain, at a minimum, a `username` attribute,
        // this object will accessible as `request.auth.credentials` in routes
        callback(isValid, {username: username})
      }
    }
  },
  {
    register: require('../index'),
    options: {
      handler: function (request, callback) {
        callback(null, {username: request.auth.credentials.username, roles: ['admin']})
      },
      allowUnauthenticated: true
    }
  }
]

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }

    server.auth.strategy('form', 'form')

    server.route({
      method: 'GET',
      path: '/admin',
      handler: function (request, reply) {
        return reply('admin')
      },
      config: {
        auth: 'form',
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
        auth: 'form',
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
