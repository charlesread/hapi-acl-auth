'use strict'

const Hapi = require('hapi')

// Create a server with a host and port
const server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 8000
})

const plugins = [
  {
    register: require('hapi-server-session'),
    options: {
      cookie: {
        isSecure: false,
      },
    },
  },
  {
    register: require('../index'),
    options: {
      loginPath: '/login1'
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
          hapiAuthAuth: {
            secure: true
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
      config: {
        plugins: {
          hapiAuthAuth: {
            secure: false
          }
        }
      },
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
