'use strict'

/*

 Simple example using HTTP Basic for authentication.
 In this example we are "getting" the roles for the user in validateFunc, really just specifying them, they will
  go into the request.auth.credentials object, which will later be used in the hapi-acl-auth handler.  In practice
  you would probably get roles from some other service, like a DB, during the authentication process.

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
    register: require('../index'),
    options: {
      handler: function (request, callback) {
        // request.auth.credentials just happens to be the object passed to callback() in validateFunc
        callback(null, request.auth.credentials)
      }
    }
  },
  {
    register: require('hapi-auth-basic')
  }
]

const validateFunc = function (request, username, password, callback) {
  callback(null, true, {id: username, name: username, roles: ['admin']})
}

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }

    server.auth.strategy('simple', 'basic', {validateFunc: validateFunc})

    server.route({
      method: 'GET',
      path: '/admin',
      handler: function (request, reply) {
        return reply('admin')
      },
      config: {
        auth: 'simple',
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
        auth: 'simple',
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
