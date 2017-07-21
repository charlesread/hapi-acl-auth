'use strict'

/*

 Simple example that shows how you can render a custom page when not authorized.

 Policy is `deny`, by default.
 User has one role ('admin').
 User has role required by /admin.
 User does not have role required by /superuser.
 Endpoint /notsecure has secure: false, thus overriding the default deny policy.

 */

// allowing Marko template requires
require('marko/node-require')
require('marko/compiler').defaultOptions.writeToDisk = false

const fs = require('fs')
const path = require('path')
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
        callback(null, {username: 'cread', firstName: 'Charles', roles: ['user']})
      },
      // used at the plugin options level will make this the default, it can be overridden in the routes, see below
      forbiddenPageFunction: function () {
        return fs.createReadStream(path.join(__dirname, 'files', 'static403.html'))
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

    // here we're just using Marko to render dynamic content, notice that the function assigned to forbiddenPageFunction
    // actually accepts a parameter; the object passed to callback(err, object) in the plugin handler also gets passed
    // to the forbiddenPageFunction function, {username: 'cread', firstName: 'Charles', roles: ['user']} in this case
    server.route({
      method: 'GET',
      path: '/superuser',
      handler: function (request, reply) {
        return reply('superuser')
      },
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['superuser'],
            forbiddenPageFunction: function (handlerObject) {
              // grab the Marko template
              const page = require(path.join(__dirname, 'files', 'template403.marko'))
              // pass the object from callback(err, object) to the template so that it can be used in the template
              return page.stream(handlerObject)
            }
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
