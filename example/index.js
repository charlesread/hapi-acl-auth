'use strict'

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
        callback(null, {username: 'cread', roles: ['SUPERUSER']})
      },
      hierarchy: ['USER', 'ADMIN', 'SUPERUSER']
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
      path: '/protected',
      config: {
        plugins: {
          hapiAclAuth: {
            roles: ['ADMIN']
          }
        }
      },
      handler: function (request, reply) {
        return reply('protected')
      }
    })

    server.route({
      method: 'GET',
      path: '/notprotected',
      handler: function (request, reply) {
        return reply('notprotected')
      }
    })
  })

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
