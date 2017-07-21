'use strict'

/*

 Simple example with caching, also displays the ability for `roles` to be a function.

 The `roles` attributes in both the plugin and route options can be either arrays of strings, functions that return
 arrays, or functions that return Promises that resolve arrays.  If the functions are do resource intensive operations,
 or operations that can take some time, it might make sense to cache the results so that each request does not have
 to wait on the function to return.  The `cache` plugin attribute will enable caching of the roles, increasing
 response time and generally just being more responsible with resources.

 Policy is `deny`, by default.
 User has one role ('admin').
 User has role required by /admin.

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
      cache: true
    }
  }
]

server.register(
  plugins,
  function (err) {
    if (err) {
      throw err
    }

    // notice that the first request to this route will take 5000 milliseconds to respond, subsequent
    // request will not, because the result of the function is cached
    server.route({
      method: 'GET',
      path: '/admin',
      handler: function (request, reply) {
        return reply('admin')
      },
      config: {
        plugins: {
          hapiAclAuth: {
            roles: function () {
              return new Promise((resolve) => {
                // simulating some task that takes some time, like hitting a DB for roles for this route
                setTimeout(function () {
                  resolve(['admin1'])
                }, 5000)
              })
            }
          }
        }
      }
    })
  })

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
